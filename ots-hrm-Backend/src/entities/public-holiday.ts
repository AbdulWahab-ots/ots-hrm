import { Column, Entity, JoinColumn, ManyToOne, Index } from "typeorm";
import { HolidayType, IPublicHolidayRequest, IPublicHolidayResponse, ITokenUser } from "../models";
import { IToResponseBase } from "./abstractions/to-response-base";
import { CompanyEntityBase } from "./base-entities/company-entity-base";
import { Department } from "./department";
import { Country } from "./country";

@Entity('PublicHoliday')
// Partial unique index: only enforced among non-deleted rows, so a soft-deleted
// holiday's name doesn't block creating a new one with the same value.
@Index(['companyId', 'name', 'departmentId'], { unique: true, where: '"deleted" = false' }) // Changed unique constraint to name instead of date
@Index(['companyId', 'departmentId']) // Index for company and department queries
@Index(['departmentId']) // Index for department queries
export class PublicHoliday extends CompanyEntityBase implements IToResponseBase<PublicHoliday, IPublicHolidayResponse> {
    
    @Column({ type: 'varchar', length: 255, nullable: false })
    name!: string;

    @Column({ type: 'json', nullable: false }) // Store as JSON array of date strings
    dates!: string[];

    @Column({ type: 'boolean', default: false, nullable: false })
    isMultiple!: boolean;

    @Column({ type: 'enum', enum: HolidayType, nullable: true })
    type!: HolidayType;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'uuid', nullable: true })
    whichCountryId?: string;

    @Column({ type: 'uuid', nullable: false })
    departmentId!: string;

    // Relationship with Country - nullable
    @ManyToOne(() => Country, { 
        nullable: true, 
        eager: false,
        onDelete: 'SET NULL'
    })
    @JoinColumn({ name: 'whichCountryId', referencedColumnName: 'id' })
    country?: Country;

    // Many-to-One relationship with Department
    @ManyToOne(() => Department, department => department.publicHolidays, {
        nullable: false,
        eager: false,
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'departmentId', referencedColumnName: 'id' })
    department!: Department;
    
    toResponse(entity?: PublicHoliday): IPublicHolidayResponse {
        if(!entity) entity = this;

        return {
            ...super.toCompanyResponseBase(entity),
            name: entity.name,
            dates: entity.dates,
            isMultiple: entity.isMultiple,
            type: entity.type,
            description: entity.description,
            whichCountryId: entity.whichCountryId,
            departmentId: entity.departmentId,
            country: entity.country ? {
                id: entity.country.id,
                name: entity.country.name,
                code: entity.country.code
            } : undefined,
            department: entity.department ? entity.department.toResponse() : undefined
        }
    }

    toEntity = (entityRequest: IPublicHolidayRequest, id?: string, contextUser?: ITokenUser): PublicHoliday => {
        this.name = entityRequest.name;
        this.dates = entityRequest.dates;
        this.isMultiple = entityRequest.isMultiple;
        this.type = entityRequest.type as HolidayType;
        this.description = entityRequest.description;
        this.whichCountryId = entityRequest.whichCountryId;
        this.departmentId = entityRequest.departmentId;

        // Set country if whichCountryId is provided
        if (entityRequest.whichCountryId) {
            let country = new Country();
            country.id = entityRequest.whichCountryId;
            this.country = country;
        }

        // Set department
        if (entityRequest.departmentId) {
            let department = new Department();
            department.id = entityRequest.departmentId;
            this.department = department;
        }

        if(contextUser) super.toCompanyEntity(contextUser, id);
        
        return this;
    }

    // Helper method to add a date
    addDate(date: string): void {
        if (!this.dates) {
            this.dates = [];
        }
        if (!this.dates.includes(date)) {
            this.dates.push(date);
        }
        this.isMultiple = this.dates.length > 1;
    }

    // Helper method to remove a date
    removeDate(date: string): void {
        if (this.dates) {
            this.dates = this.dates.filter(d => d !== date);
            this.isMultiple = this.dates.length > 1;
        }
    }

    // Helper method to check if a specific date exists
    hasDate(date: string): boolean {
        return this.dates ? this.dates.includes(date) : false;
    }
}