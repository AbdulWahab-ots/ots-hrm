import { DataSource } from "typeorm";
import { Privilege } from "../../entities";
import { Privileges } from "../../constants";
import { toCamelCase } from "../../utility/string-utility";

export const createPrivilegesForModule = async (dataSource: DataSource, module: string) => {
  const privilegeRepo = dataSource.getRepository(Privilege);
  
  console.log(`🔐 Creating privileges for ${module} module...`);
  
  const modulePrivileges: Array<Privilege> = [];
  
  for (const privilege of Privileges) {
    const privilegeName = `${privilege} ${module}`;
    const privilegeCode = toCamelCase(`${privilege}${module.replaceAll(" ", "")}`);
    
    // Check if privilege already exists
    let existingPrivilege = await privilegeRepo.findOne({ where: { code: privilegeCode } });
    
    if (existingPrivilege) {
      existingPrivilege.name = privilegeName;
      existingPrivilege.module = module;
      await privilegeRepo.save(existingPrivilege);
    } else {
      let newPrivilege = new Privilege().newInstanceToAdd(privilegeName, privilegeCode);
      newPrivilege.module = module;
      modulePrivileges.push(newPrivilege);
    }
  }
  
  if (modulePrivileges.length > 0) {
    await privilegeRepo.save(modulePrivileges);
    console.log(`✅ Created ${modulePrivileges.length} new privileges for ${module} module`);
  } else {
    console.log(`✅ All privileges for ${module} module already exist`);
  }
  
  return modulePrivileges;
};
