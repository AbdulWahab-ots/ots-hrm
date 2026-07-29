import { Column, JoinColumn, ManyToOne } from "typeorm";
import { EntityBase } from "./entity-base";
import { Company } from "../company";
import { ICompanyResponseBase } from "../../models/inerfaces/response/response-base";
import { ITokenUser } from "../../models";

export abstract class CompanyEntityBase extends EntityBase {
  @Column({ type: "uuid", nullable: false })
  companyId!: string;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: "companyId", referencedColumnName: "id" })
  company?: Company;

  protected toCompanyEntity(contextUser: ITokenUser, id?: string): CompanyEntityBase {
    super.toBaseEntiy(contextUser, id);
    
    if (contextUser.companyId) {
      this.companyId = contextUser.companyId;
      this.company = new Company();
      this.company.id = contextUser.companyId;
    }

    return this;
  }

  protected toCompanyResponseBase<T extends CompanyEntityBase>(entity: T): ICompanyResponseBase {
    return {
      ...super.toResponseBase(entity),
      companyId: entity.companyId,
      company: entity.company ? entity.company.toResponse() : undefined
    };
  }
}
