import { DataSource } from "typeorm";
import { Company, Role, User } from "../../entities";
import { randomUUID, randomBytes } from "crypto";
import { EmptyGuid, DefaultRoles, DefaultRoleDetails } from "../../constants";
import { encrypt } from "../../utility/bcrypt-utility";
import { Gender } from "../../models";

// Generates a strong, URL-safe random password for first-login bootstrap.
const generatePassword = (): string => randomBytes(18).toString("base64url");

export const createDefaultCompanyAndAdmin = async (dataSource: DataSource) => {
  const companyRepo = dataSource.getRepository(Company);
  const userRepo = dataSource.getRepository(User);
  const roleRepo = dataSource.getRepository(Role);

  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@company.com";
  const envPassword = process.env.DEFAULT_ADMIN_PASSWORD;
  if (!envPassword && process.env.NODE_ENV === "production") {
    throw new Error(
      "DEFAULT_ADMIN_PASSWORD must be set to run the default-company seeder in production."
    );
  }
  const passwordWasGenerated = !envPassword;
  const adminPassword = envPassword || generatePassword();

  console.log("🏢 Setting up default company with its own roles...");
  
  // Check if default company already exists
  let defaultCompany = await companyRepo.findOne({ where: { name: "Default Company" } });
  
  if (!defaultCompany) {
    // Step 1: Create default company
    defaultCompany = new Company().toEntity({
      name: "Default Company",
      phoneNo: "000000000000",
      email: "default@company.com",
      address: "Default Address",
      temporaryAddress: "",
      zipCode: 12345,
      country: "USA",
      state: "California",
      city: "San Francisco"
    }, undefined, { name: "System", id: EmptyGuid, companyId: '', role: "", roleId: "", privileges: [] });
    
    defaultCompany.id = randomUUID();
    await companyRepo.save(defaultCompany);
    console.log("✅ Created default company");
    
    // Step 2: Create company-specific Admin role
    const adminRoleDetails = DefaultRoleDetails[DefaultRoles.Admin];
    const adminRole = new Role().toEntity(
      { 
        name: adminRoleDetails.name, 
        code: adminRoleDetails.code, 
        privilegeIds: [] 
      }, 
      undefined,
      { name: "System", id: EmptyGuid, companyId: defaultCompany.id, role: "", roleId: "", privileges: [] }
    );
    adminRole.id = randomUUID();
    adminRole.privileges = [];
    adminRole.companyId = defaultCompany.id;
    adminRole.company = defaultCompany;
    adminRole.isEditable = false; // Default role should not be editable
    await roleRepo.save(adminRole);
    console.log("✅ Created company-specific Admin role");
    
    // Step 3: Create company-specific Employee role
    const employeeRoleDetails = DefaultRoleDetails[DefaultRoles.Employee];
    const employeeRole = new Role().toEntity(
      { 
        name: employeeRoleDetails.name, 
        code: employeeRoleDetails.code, 
        privilegeIds: [] 
      }, 
      undefined,
      { name: "System", id: EmptyGuid, companyId: defaultCompany.id, role: "", roleId: "", privileges: [] }
    );
    employeeRole.id = randomUUID();
    employeeRole.privileges = [];
    employeeRole.companyId = defaultCompany.id;
    employeeRole.company = defaultCompany;
    employeeRole.isEditable = false; // Default role should not be editable
    await roleRepo.save(employeeRole);
    console.log("✅ Created company-specific Employee role");
    
    // Step 4: Create default admin user for this company
    const defaultUser: User = new User().toEntity(
      {
        userName: "companyAdmin",
        email: adminEmail,
        firstName: "Company",
        middleName: undefined,
        gender: Gender.Male,
        lastName: "Admin",
        dateOfBirth: new Date(),
        password: adminPassword,
        roleId: adminRole.id,
        isGoogleSignup: false,
        isEmailVerified: true,
      },
      undefined,
      { name: "System", id: EmptyGuid, companyId: defaultCompany.id, roleId: adminRole.id, role: adminRole.code, privileges: [] }
    );

    defaultUser.passwordHash = await encrypt(adminPassword);
    defaultUser.company = defaultCompany;
    await userRepo.save(defaultUser);
    console.log("✅ Created default company admin user");

    console.log("🎉 Default company setup completed with company-specific roles!");
    console.log(`📧 Company Admin Email: ${adminEmail}`);
    if (passwordWasGenerated) {
      console.log(`🔑 Company Admin Password (shown once — store it now): ${adminPassword}`);
    } else {
      console.log(`🔑 Company Admin Password: (using DEFAULT_ADMIN_PASSWORD from environment)`);
    }
  } else {
    console.log("✅ Default company already exists");
  }
};

// Function to create roles for any new company
export const createCompanyDefaultRoles = async (dataSource: DataSource, company: Company) => {
  const roleRepo = dataSource.getRepository(Role);
  
  console.log(`🏢 Creating default roles for company: ${company.name}...`);
  
  const rolesToCreate = [];
  
  // Create Admin role for this company
  const adminRoleDetails = DefaultRoleDetails[DefaultRoles.Admin];
  const adminRole = new Role().toEntity(
    { 
      name: adminRoleDetails.name, 
      code: adminRoleDetails.code, 
      privilegeIds: [] 
    }, 
    undefined,
    { name: "System", id: EmptyGuid, companyId: company.id, role: "", roleId: "", privileges: [] }
  );
  adminRole.id = randomUUID();
  adminRole.privileges = [];
  adminRole.companyId = company.id;
  adminRole.company = company;
  adminRole.isEditable = false; // Default role should not be editable
  rolesToCreate.push(adminRole);
  
  // Create Employee role for this company
  const employeeRoleDetails = DefaultRoleDetails[DefaultRoles.Employee];
  const employeeRole = new Role().toEntity(
    { 
      name: employeeRoleDetails.name, 
      code: employeeRoleDetails.code, 
      privilegeIds: [] 
    }, 
    undefined,
    { name: "System", id: EmptyGuid, companyId: company.id, role: "", roleId: "", privileges: [] }
  );
  employeeRole.id = randomUUID();
  employeeRole.privileges = [];
  employeeRole.companyId = company.id;
  employeeRole.company = company;
  employeeRole.isEditable = false; // Default role should not be editable
  rolesToCreate.push(employeeRole);
  
  await roleRepo.save(rolesToCreate);
  console.log(`✅ Created ${rolesToCreate.length} default roles for company: ${company.name}`);
  
  return { adminRole, employeeRole };
};
