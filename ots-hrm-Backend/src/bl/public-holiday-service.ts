import { inject, injectable } from "tsyringe";
import { PublicHolidayRepository, AttendanceRepository, EmployeeRepository } from "../dal";
import { PublicHoliday, Attendance } from "../entities";
import { IPublicHolidayRequest, IPublicHolidayResponse, ITokenUser, AttendanceStatus, EmployeeStatus, Actions } from "../models";
import { Service } from "./generics/service";
import { Not, In } from "typeorm";
import { AppError } from "../utility/app-error";

@injectable()
export class PublicHolidayService extends Service<PublicHoliday, IPublicHolidayResponse, IPublicHolidayRequest> {
    constructor(
        @inject('PublicHolidayRepository') private readonly publicHolidayRepository: PublicHolidayRepository,
        @inject('AttendanceRepository') private readonly attendanceRepository: AttendanceRepository,
        @inject('EmployeeRepository') private readonly employeeRepository: EmployeeRepository
    ) {
        super(publicHolidayRepository, () => new PublicHoliday)
    }

    public async add(request: IPublicHolidayRequest, contextUser: ITokenUser): Promise<IPublicHolidayResponse> {
        // Check for conflicts with existing holidays on any of the requested dates
        await this.checkDateConflicts(request, contextUser);

        const publicHoliday = await super.add(request, contextUser);

        // Create attendance records for all employees in the department for the holiday dates
        await this.createAttendanceForHoliday(publicHoliday, contextUser);

        return publicHoliday;
    }

    public async update(id: string, request: IPublicHolidayRequest, contextUser: ITokenUser): Promise<IPublicHolidayResponse> {
        // Get the existing holiday to compare dates
        const existingHoliday = await this.publicHolidayRepository.firstOrDefault({
            where: { id }
        });

        if (!existingHoliday) {
            throw new AppError('Public holiday not found', '404');
        }

        // Check for conflicts with existing holidays on any of the requested dates, excluding current record
        await this.checkDateConflicts(request, contextUser, id);

        const updatedHoliday = await super.update(id, request, contextUser);

        // Update attendance records based on date changes
        await this.updateAttendanceForHoliday(existingHoliday, updatedHoliday, contextUser);

        return updatedHoliday;
    }

    public async delete(id: string, contextUser: ITokenUser): Promise<void> {
        // Get the holiday before deletion to clean up attendance records
        const holiday = await this.publicHolidayRepository.firstOrDefault({
            where: { id }
        });

        if (!holiday) {
            throw new AppError('Public holiday not found', '404');
        }

        // Clean up attendance records
        await this.cleanupAttendanceForHoliday(holiday, contextUser);

        // Soft delete instead of hard-removing, so the holiday stays available for
        // historical/audit purposes while disappearing from active lists.
        await this.publicHolidayRepository.partialUpdate(id, { deleted: true, active: false } as any, contextUser);
    }

    /**
     * Get active employees in a department with shift information
     */
    private async getDepartmentEmployees(departmentId: string, contextUser: ITokenUser) {
        return await this.employeeRepository.getCompanyRecords(contextUser.companyId, {
            where: {
                departmentId: departmentId,
                active: true,
                status: In([EmployeeStatus.PERMANENT, EmployeeStatus.CONTRACT, EmployeeStatus.PROBATION])
            },
            relations: {
                shift: true
            }
        });
    }

    /**
     * Process attendance records for multiple employees and dates
     */
    private async processAttendanceRecords(
        employees: any[],
        dates: string[],
        holidayId: string,
        contextUser: ITokenUser,
        operation: 'create' | 'update' | 'cleanup'
    ): Promise<void> {
        for (const date of dates) {
            for (const employee of employees) {
                if (operation === 'cleanup') {
                    await this.cleanupAttendanceRecord(
                        employee.userId,
                        new Date(date),
                        holidayId,
                        contextUser
                    );
                } else {
                    await this.createOrUpdateAttendanceRecord(
                        employee.userId,
                        new Date(date),
                        holidayId,
                        contextUser,
                        operation
                    );
                }
            }
        }
    }

    /**
     * Create attendance records for all employees in the department for the holiday dates
     */
    private async createAttendanceForHoliday(holiday: IPublicHolidayResponse, contextUser: ITokenUser): Promise<void> {
        try {
            if (!holiday.departmentId) return;
            
            const employees = await this.getDepartmentEmployees(holiday.departmentId, contextUser);
            await this.processAttendanceRecords(employees, holiday.dates, holiday.id, contextUser, 'create');
        } catch (error) {
            console.error('Error creating attendance records for holiday:', error);
        }
    }

    /**
     * Update attendance records when holiday dates change
     */
    private async updateAttendanceForHoliday(
        existingHoliday: PublicHoliday,
        updatedHoliday: IPublicHolidayResponse,
        contextUser: ITokenUser
    ): Promise<void> {
        try {
            if (!updatedHoliday.departmentId) return;
            
            const employees = await this.getDepartmentEmployees(updatedHoliday.departmentId, contextUser);

            // Find dates that were removed, added, or remained
            const removedDates = existingHoliday.dates.filter(date => !updatedHoliday.dates.includes(date));
            const addedDates = updatedHoliday.dates.filter(date => !existingHoliday.dates.includes(date));
            const remainingDates = existingHoliday.dates.filter(date => updatedHoliday.dates.includes(date));

            // Process each type of date change
            await this.processAttendanceRecords(employees, removedDates, existingHoliday.id, contextUser, 'cleanup');
            await this.processAttendanceRecords(employees, addedDates, updatedHoliday.id, contextUser, 'create');
            await this.processAttendanceRecords(employees, remainingDates, updatedHoliday.id, contextUser, 'update');
        } catch (error) {
            console.error('Error updating attendance records for holiday:', error);
        }
    }

    /**
     * Clean up attendance records when holiday is deleted
     */
    private async cleanupAttendanceForHoliday(holiday: PublicHoliday, contextUser: ITokenUser): Promise<void> {
        try {
            if (!holiday.departmentId) return;
            
            const employees = await this.getDepartmentEmployees(holiday.departmentId, contextUser);
            await this.processAttendanceRecords(employees, holiday.dates, holiday.id, contextUser, 'cleanup');
        } catch (error) {
            console.error('Error cleaning up attendance records for holiday:', error);
        }
    }

    /**
     * Create or update attendance record for a specific employee and date
     */
    private async createOrUpdateAttendanceRecord(
        userId: string,
        date: Date,
        holidayId: string,
        contextUser: ITokenUser,
        operation: 'create' | 'update'
    ): Promise<void> {
        try {
            // Get employee record with shift details
            const employee = await this.employeeRepository.firstOrDefault({
                where: {
                    userId: userId,
                    companyId: contextUser.companyId,
                    active: true
                },
                relations: {
                    shift: true
                }
            });

            // Helper function to set shift-related fields
            const setShiftFields = (attendance: any) => {
                if (employee?.shiftId && employee?.shift) {
                    attendance.shiftId = employee.shiftId;
                    attendance.totalWorkingHours = employee.shift.workingHours / 60; // Convert minutes to hours
                    attendance.minimumRequiredWorkingHour = 0; // Set to 0 for holiday days
                    
                    console.log('Shift fields set for holiday:', {
                        shiftId: attendance.shiftId,
                        totalWorkingHours: attendance.totalWorkingHours,
                        minimumRequiredWorkingHour: attendance.minimumRequiredWorkingHour
                    });
                } else {
                    console.log('No shift information found for employee on holiday');
                }
            };

            // Check if attendance record already exists
            const existingAttendance = await this.attendanceRepository.firstOrDefault({
                where: {
                    userId: userId,
                    date: date
                }
            });

            if (existingAttendance) {
                // Update existing record
                existingAttendance.status = AttendanceStatus.HOLIDAY;
                existingAttendance.publicHolidayId = holidayId;
                existingAttendance.notes = operation === 'create' ? 'Public Holiday' : existingAttendance.notes;
                
                // Set shift and working hours
                setShiftFields(existingAttendance);

                await this.attendanceRepository.partialUpdate(
                    existingAttendance.id,
                    existingAttendance,
                    contextUser
                );
            } else {
                // Create new attendance record
                const attendanceEntity = new Attendance().toEntity(
                    {
                        userId: userId,
                        date: date,
                        status: AttendanceStatus.HOLIDAY,
                        publicHolidayId: holidayId,
                        notes: 'Public Holiday'
                    } as any,
                    undefined,
                    contextUser
                );

                // Set shift and working hours
                setShiftFields(attendanceEntity);

                await this.attendanceRepository.invokeDbOperations(attendanceEntity, Actions.Add);
            }
        } catch (error) {
            console.error(`Error creating/updating attendance record for user ${userId} on date ${date.toISOString().split('T')[0]}:`, error);
            // Don't throw error for individual record operations
        }
    }

    /**
     * Clean up attendance record by removing holiday reference and resetting status
     */
    private async cleanupAttendanceRecord(
        userId: string,
        date: Date,
        holidayId: string,
        contextUser: ITokenUser
    ): Promise<void> {
        try {
            // Find attendance record that was marked as holiday for this specific holiday
            const existingAttendance = await this.attendanceRepository.firstOrDefault({
                where: {
                    userId: userId,
                    date: date,
                    publicHolidayId: holidayId
                }
            });

            if (existingAttendance) {
                // Reset the attendance record to default status
                const updateData = {
                    status: AttendanceStatus.DEFAULT,
                    publicHolidayId: null,
                    notes: ''
                };

                await this.attendanceRepository.partialUpdate(
                    existingAttendance.id,
                    updateData as any,
                    contextUser
                );
            }
        } catch (error) {
            console.error(`Error cleaning up attendance record for user ${userId} on date ${date.toISOString().split('T')[0]}:`, error);
            // Don't throw error for individual record cleanup
        }
    }

    /**
     * Check if any of the provided dates conflict with existing holidays
     */
    private async checkDateConflicts(request: IPublicHolidayRequest, contextUser: ITokenUser, excludeId?: string): Promise<void> {
        const whereCondition: any = {
            departmentId: request.departmentId,
            deleted: false
        };

        if (excludeId) {
            whereCondition.id = Not(excludeId);
            whereCondition.companyId = contextUser.companyId;
        }

        // Find all existing holidays for the company and department
        const existingHolidays = await this.publicHolidayRepository.getCompanyRecords(contextUser.companyId, {
            where: whereCondition
        });

        // Check if any of the new dates conflict with existing holiday dates
        const conflictingDates: string[] = [];
        
        for (const holiday of existingHolidays) {
            const overlappingDates = request.dates.filter(date => holiday.dates.includes(date));
            if (overlappingDates.length > 0) {
                conflictingDates.push(...overlappingDates);
            }
        }

        if (conflictingDates.length > 0) {
            const uniqueConflictingDates = [...new Set(conflictingDates)];
            throw new AppError(`Public holiday(s) already exist for the following date(s): ${uniqueConflictingDates.join(', ')}`, '409');
        }
    }

}