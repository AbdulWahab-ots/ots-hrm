import { DataSource } from "typeorm";
import { Company, Privilege, Role, User } from "../../entities";
import { randomUUID, randomBytes } from "crypto";
import { EmptyGuid, FullSystemAccessPrivileges, DefaultRoles, DefaultRoleDetails } from "../../constants";
import { encrypt } from "../../utility/bcrypt-utility";
import { Gender } from "../../models";

// Generates a strong, URL-safe random password for first-login bootstrap.
const generatePassword = (): string => randomBytes(18).toString("base64url");

export const superAdminSetup = async (dataSource: DataSource) => {
  const companyRepo = dataSource.getRepository(Company);
  const userRepo = dataSource.getRepository(User);
  const roleRepo = dataSource.getRepository(Role);
  const privilegeRepo = dataSource.getRepository(Privilege);

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "superadmin@hrm.com";
  const username = "superadmin";

  // Password precedence: explicit env var, else a freshly generated random one.
  // Never ship a hardcoded default. In production, refuse to invent one silently.
  const envPassword = process.env.SUPER_ADMIN_PASSWORD;
  if (!envPassword && process.env.NODE_ENV === "production") {
    throw new Error(
      "SUPER_ADMIN_PASSWORD must be set to run the super-admin seeder in production."
    );
  }
  const passwordWasGenerated = !envPassword;
  const superAdminPassword = envPassword || generatePassword();

  console.log("🚀 Starting Super Admin Setup...");

  // ✅ Step 1: Create or update Full System Access Privilege
  const superAdminPrivilegeCode = FullSystemAccessPrivileges.code;
  const superAdminPrivilegeName = FullSystemAccessPrivileges.name;

  let superAdminPrivilege = await privilegeRepo.findOne({ where: { code: superAdminPrivilegeCode } });
  if (superAdminPrivilege) {
    superAdminPrivilege.name = superAdminPrivilegeName;
    superAdminPrivilege.module = "System";
    await privilegeRepo.save(superAdminPrivilege);
    console.log("✅ Updated Full System Access privilege");
  } else {
    superAdminPrivilege = new Privilege().newInstanceToAdd(superAdminPrivilegeName, superAdminPrivilegeCode);
    superAdminPrivilege.module = "System";
    await privilegeRepo.save(superAdminPrivilege);
    console.log("✅ Created Full System Access privilege");
  }

  // ✅ Step 2: Find or create Super Admin Role (assign ONLY Full System Access privilege)
  const superAdminRoleDetails = DefaultRoleDetails[DefaultRoles.SuperAdmin];
  let superAdminRole = await roleRepo.findOne({ where: { code: superAdminRoleDetails.code } });
  
  if (!superAdminRole) {
    superAdminRole = new Role().toEntity(
      {
        name: superAdminRoleDetails.name,
        code: superAdminRoleDetails.code,
        privilegeIds: [superAdminPrivilege.id],
      },
      undefined,
      { name: "System", id: EmptyGuid, companyId: "", roleId: "", role: "", privileges: [] }
    );
    superAdminRole.id = randomUUID();
    superAdminRole.privileges = [superAdminPrivilege];
    superAdminRole.companyId = undefined;
    superAdminRole.company = undefined;
    await roleRepo.save(superAdminRole);
    console.log("✅ Created Super Admin role");
  } else {
    // Update privilege to only Full System Access
    superAdminRole.privileges = [superAdminPrivilege];
    superAdminRole.name = superAdminRoleDetails.name;
    await roleRepo.save(superAdminRole);
    console.log("✅ Updated Super Admin role");
  }

  // ✅ Step 3: Create dummy company for Super Admin
  let superAdminCompany = await companyRepo.findOne({ where: { name: FullSystemAccessPrivileges.name } });
  if (!superAdminCompany) {
    superAdminCompany = new Company().toEntity({
      name: FullSystemAccessPrivileges.name,
      phoneNo: "0000000000",
      email: superAdminEmail,
      address: "System",
      temporaryAddress: "",
      zipCode: 0,
      country: "System",
      state: "System",
      city: "System",
    }, undefined, { name: "System", id: EmptyGuid, companyId: '', roleId: "", role: "", privileges: [] });
    superAdminCompany.id = randomUUID();
    superAdminCompany.isSystemCompany = true;
    await companyRepo.save(superAdminCompany);
    console.log("✅ Created Super Admin company");
  } else {
    // Ensure existing super admin company is always flagged as the system company
    if (!superAdminCompany.isSystemCompany) {
      superAdminCompany.isSystemCompany = true;
      await companyRepo.save(superAdminCompany);
    }
    console.log("✅ Super Admin company already exists");
  }

  // ✅ Step 4: Create Super Admin User if not exists
  let superAdminUser = await userRepo.findOne({ where: { email: superAdminEmail } });
  if (!superAdminUser) {
    superAdminUser = new User().toEntity({
      userName: username ,
      email: superAdminEmail,
      firstName: "Super",
      middleName: undefined,
      gender: Gender.Male,
      lastName: "Admin",
      dateOfBirth: new Date(),
      password: superAdminPassword,
      roleId: superAdminRole.id,
      isGoogleSignup: false,
      isEmailVerified: true,
    }, undefined, { name: "System", id: EmptyGuid, companyId: EmptyGuid, roleId: superAdminRole.id, role: superAdminRole.code, privileges: [] });

    superAdminUser.passwordHash = await encrypt(superAdminPassword);
    superAdminUser.company = superAdminCompany;
    await userRepo.save(superAdminUser);
    console.log("✅ Created Super Admin user");
  } else {
    // Update existing super admin user
    superAdminUser.roleId = superAdminRole.id;
    superAdminUser.company = superAdminCompany;
    superAdminUser.isEmailVerified = true;

    await userRepo.save(superAdminUser);
    console.log("✅ Updated Super Admin user");
  }

  console.log("🎉 Super Admin Setup completed successfully!");
  console.log(`📧 Email: ${superAdminEmail}`);
  if (passwordWasGenerated) {
    // Only surface a freshly generated password, and only this once, so the
    // operator can capture it for first login. Env-supplied passwords are never logged.
    console.log("🔑 A random password was generated for the super admin.");
    console.log(`🔑 Password (shown once — store it now): ${superAdminPassword}`);
  } else {
    console.log("🔑 Password: (using SUPER_ADMIN_PASSWORD from environment)");
  }
};
