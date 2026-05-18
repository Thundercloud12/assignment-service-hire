import { connectDatabase, disconnectDatabase } from '../config/database';
import { authService } from '../services/auth.service';
import { leadService } from '../services/lead.service';
import { EmailTemplate } from '../models/EmailTemplate';
import logger from '../config/logger';

const seedDatabase = async () => {
  try {
    logger.info('Connecting to the database for seeding...');
    await connectDatabase();

    logger.info('Creating Acme Corporation Tenant (Workspace)...');
    const acmeAdminResponse = await authService.register({
      fullName: 'Acme Admin',
      email: 'acme.admin@clickleads.com',
      password: 'password123',
      role: 'admin',
    });
    const acmeOrgId = acmeAdminResponse.user.organizationId;
    const acmeAdminId = acmeAdminResponse.user.id;
    logger.info(`Acme Admin registered. User ID: ${acmeAdminId}, Organization ID: ${acmeOrgId}`);

    const acmeSalesResponse = await authService.register({
      fullName: 'Acme Sales',
      email: 'acme.sales@clickleads.com',
      password: 'password123',
      role: 'sales_user',
      organizationId: acmeOrgId,
    });
    const acmeSalesId = acmeSalesResponse.user.id;
    logger.info(`Acme Sales Representative registered. User ID: ${acmeSalesId}`);

    logger.info('Creating Stark Tech Tenant (Workspace)...');
    const starkAdminResponse = await authService.register({
      fullName: 'Stark Admin',
      email: 'stark.admin@clickleads.com',
      password: 'password123',
      role: 'admin',
    });
    const starkOrgId = starkAdminResponse.user.organizationId;
    const starkAdminId = starkAdminResponse.user.id;
    logger.info(`Stark Admin registered. User ID: ${starkAdminId}, Organization ID: ${starkOrgId}`);

    const starkSalesResponse = await authService.register({
      fullName: 'Stark Sales',
      email: 'stark.sales@clickleads.com',
      password: 'password123',
      role: 'sales_user',
      organizationId: starkOrgId,
    });
    const starkSalesId = starkSalesResponse.user.id;
    logger.info(`Stark Sales Representative registered. User ID: ${starkSalesId}`);

    // Create Acme Leads
    logger.info('Populating Acme Leads...');
    const acmeLeads = [
      { name: 'Alice Vance', email: 'alice.vance@acmecontacts.com', phone: '+15550199', status: 'new', source: 'website' },
      { name: 'Bob Miller', email: 'bob.miller@acmepartner.com', phone: '+15550244', status: 'contacted', source: 'referral' },
      { name: 'Charlie Cox', email: 'charlie.cox@acmeclient.com', phone: '+15550388', status: 'qualified', source: 'other' },
      { name: 'Diana Prince', email: 'diana.prince@acmeleads.com', phone: '+15550477', status: 'contacted', source: 'instagram' },
    ];

    for (const lead of acmeLeads) {
      const created = await leadService.createLead({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status as any,
        source: lead.source as any,
        assignedTo: acmeSalesId,
      }, acmeSalesId, acmeOrgId);
      logger.info(`Created Acme Lead: ${created.name} (${created.email}) with initial score: ${created.leadScore}`);
    }

    // Create Stark Leads
    logger.info('Populating Stark Leads...');
    const starkLeads = [
      { name: 'Tony Stark', email: 'tony@starkindustries.com', phone: '+19175550100', status: 'qualified', source: 'referral' },
      { name: 'Pepper Potts', email: 'pepper@starkindustries.com', phone: '+19175550200', status: 'contacted', source: 'website' },
      { name: 'Happy Hogan', email: 'happy@starkindustries.com', phone: '+19175550300', status: 'new', source: 'other' },
      { name: 'Bruce Banner', email: 'bruce@starkscience.com', phone: '+19175550400', status: 'new', source: 'instagram' },
    ];

    for (const lead of starkLeads) {
      const created = await leadService.createLead({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status as any,
        source: lead.source as any,
        assignedTo: starkSalesId,
      }, starkSalesId, starkOrgId);
      logger.info(`Created Stark Lead: ${created.name} (${created.email}) with initial score: ${created.leadScore}`);
    }

    // Create default email templates
    logger.info('Creating standard email templates...');
    await EmailTemplate.create({
      name: 'Welcome Template',
      subject: 'Welcome to our platform, {{name}}!',
      body: 'Hi {{name}},\n\nThanks for reaching out! We are excited to support you.\n\nBest,\nSales Team',
      variables: ['name', 'email'],
      createdBy: acmeAdminId,
    });

    await EmailTemplate.create({
      name: 'Follow Up Template',
      subject: 'Following up on our conversation',
      body: 'Hi {{name}},\n\nJust wanted to follow up and see if you had any questions regarding our proposal.\n\nWarm regards,\nSales Team',
      variables: ['name'],
      createdBy: starkAdminId,
    });

    logger.info('Database seeding completed successfully!');
  } catch (error) {
    logger.error('Failed to seed database: ' + error);
  } finally {
    await disconnectDatabase();
    logger.info('Disconnected from the database.');
  }
};

seedDatabase();
