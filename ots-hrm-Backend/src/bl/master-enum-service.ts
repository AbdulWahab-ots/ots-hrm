import { inject, injectable } from "tsyringe";
import { MasterEnumRepository } from "../dal";
import { MasterEnum } from "../entities";
import { IMasterEnumRequest, IMasterEnumResponse, IDynamicEnumResponse, IEnumItem} from "../models";
import { AttendanceStatus, PresentStatus, LevelHierarchy, EmployeeStatus, GenderSpecific, HolidayType, ScheduleType, WorkType, ShiftType, VacationStatus, DayName, Actions, UserStatus, SortOrder, AttendanceRequestType, AttendanceRequestStatus, InviteStatus, InviteExpiryDuration, InviteRole, BenefitType, BenefitValueType, BenefitFrequency, FilterMatchModes, FilterOperators } from "../models/enums";
import { DefaultRoles, Modules, Privileges, CommonRoutes } from "../constants";
import { Service } from "./generics/service";

@injectable()
export class MasterEnumService extends Service<MasterEnum, IMasterEnumResponse, IMasterEnumRequest> {
    
    constructor(@inject('MasterEnumRepository') private readonly masterEnumRepository: MasterEnumRepository) {
        super(masterEnumRepository, () => new MasterEnum())
    }

    /**
     * Convert SCREAMING_SNAKE_CASE to Title Case
     * HALF_DAY -> Half Day
     * ON_LEAVE -> On Leave
     */
    private toTitleCase(text: string): string {
        return text
            .toLowerCase()
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Convert enum to array of objects with key-value pairs
     */
    private enumToArray<T extends Record<string, string>>(enumObject: T): IEnumItem[] {
        return Object.entries(enumObject).map(([enumKey, enumValue]) => ({
            key: enumValue,
            value: this.toTitleCase(enumValue)
        }));
    }

    /**
     * DYNAMIC METHOD - Pass any number of enums with their names
     * @param enumsConfig - Object with enum name as key and enum object as value
     * @returns Dynamic response with all converted enums
     */
    public async getDynamicEnums(enumsConfig: Record<string, Record<string, string>>): Promise<IDynamicEnumResponse> {
        const result: IDynamicEnumResponse = {};

        Object.entries(enumsConfig).forEach(([enumName, enumObject]) => {
            result[enumName] = this.enumToArray(enumObject);
        });

        return result;
    }

    /**
     * Convert numeric enum to array of objects
     */
    private numericEnumToArray<T extends Record<string, string | number>>(enumObject: T): IEnumItem[] {
        return Object.entries(enumObject)
            .filter(([key, value]) => typeof value === 'number')
            .map(([enumKey, enumValue]) => ({
                key: enumValue as number,
                value: this.toTitleCase(enumKey)
            }));
    }

    /**
     * CONVENIENCE METHOD - Pre-configured common enums
     */
    public async getAll(): Promise<IDynamicEnumResponse> {
        const stringEnums = await this.getDynamicEnums({
            attendanceStatus: AttendanceStatus,
            presentStatus: PresentStatus,
            levelHierarchy: LevelHierarchy,
            employeeStatus: EmployeeStatus,
            genderSpecific: GenderSpecific,
            holidayType: HolidayType,
            scheduleType: ScheduleType,
            workType: WorkType,
            shiftType: ShiftType,
            vacationStatus: VacationStatus,
            dayName: DayName,
            attendanceRequestType: AttendanceRequestType,
            attendanceRequestStatus: AttendanceRequestStatus,
            inviteStatus: InviteStatus,
            inviteRole: InviteRole,
            benefitType: BenefitType,
            benefitValueType: BenefitValueType,
            benefitFrequency: BenefitFrequency,
            defaultRoles: DefaultRoles
        });

        // Add numeric enums
        const numericEnums = {
            userStatus: this.numericEnumToArray(UserStatus),
            sortOrder: this.numericEnumToArray(SortOrder),
            inviteExpiryDuration: this.numericEnumToArray(InviteExpiryDuration),
            filterMatchModes: this.numericEnumToArray(FilterMatchModes),
            filterOperators: this.numericEnumToArray(FilterOperators)
        };

        return {
            ...stringEnums,
            ...numericEnums
        };
    }

}

