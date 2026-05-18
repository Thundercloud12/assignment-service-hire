import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { Lead } from '../models/Lead';
import { Organization } from '../models/Organization';
import { Activity } from '../models/Activity';
import { EmailHistory } from '../models/EmailHistory';
import { EmailTemplate } from '../models/EmailTemplate';
import { FilterPreset } from '../models/FilterPreset';
import logger from '../config/logger';

const cleanDatabase = async () => {
  try {
    logger.info('Connecting to the database for cleanup...');
    await connectDatabase();

    logger.info('Wiping all MongoDB collections...');
    
    const usersWiped = await User.deleteMany({});
    logger.info(`Wiped users: ${usersWiped.deletedCount}`);

    const leadsWiped = await Lead.deleteMany({});
    logger.info(`Wiped leads: ${leadsWiped.deletedCount}`);

    const orgsWiped = await Organization.deleteMany({});
    logger.info(`Wiped organizations: ${orgsWiped.deletedCount}`);

    const activitiesWiped = await Activity.deleteMany({});
    logger.info(`Wiped activities: ${activitiesWiped.deletedCount}`);

    const emailHistoryWiped = await EmailHistory.deleteMany({});
    logger.info(`Wiped email history: ${emailHistoryWiped.deletedCount}`);

    const emailTemplatesWiped = await EmailTemplate.deleteMany({});
    logger.info(`Wiped email templates: ${emailTemplatesWiped.deletedCount}`);

    const presetsWiped = await FilterPreset.deleteMany({});
    logger.info(`Wiped filter presets: ${presetsWiped.deletedCount}`);

    logger.info('Database cleanup complete!');
  } catch (error) {
    logger.error('Failed to clean database: ' + error);
  } finally {
    await disconnectDatabase();
    logger.info('Disconnected from the database.');
  }
};

cleanDatabase();
