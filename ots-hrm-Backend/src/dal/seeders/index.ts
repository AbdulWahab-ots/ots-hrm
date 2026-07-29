import { DataSource } from "typeorm";
import { Modules } from "../../constants";
import { superAdminSetup } from "./super-admin-setup-seeder";
import { createPrivilegesForModule } from "./privilege-seeder";
import { createDefaultCompanyAndAdmin } from "./default-company-seeder";
import { CountryDataSeeder } from "./country-data-seeder";

export const runAllSeeders = async (dataSource: DataSource) => {
  console.log("🌱 Starting database seeding process...");
  
  try {
    // Step 1: Run country seeder first
    await CountryDataSeeder.seed(dataSource);
    
    // Step 2: Create privileges for all modules (system level)
    for (const module of Modules) {
      await createPrivilegesForModule(dataSource, module);
    }
    
    // Step 3: Setup super admin (system level)
    await superAdminSetup(dataSource);
    
    // // Step 4: Create default company with its own default roles
    // await createDefaultCompanyAndAdmin(dataSource);
    
    console.log("🎉 All seeders completed successfully!");
  } catch (error) {
    console.error("❌ Error running seeders:", error);
    throw error;
  }
};

// Export individual seeders for selective use
export { superAdminSetup } from "./super-admin-setup-seeder";
export { createPrivilegesForModule } from "./privilege-seeder";
export { createDefaultCompanyAndAdmin, createCompanyDefaultRoles } from "./default-company-seeder";
export { CountryDataSeeder } from "./country-data-seeder";
