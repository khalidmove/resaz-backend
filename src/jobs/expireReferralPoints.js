const cron = require('node-cron');
const User = require('../app/model/user');

// Run daily at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running referral points cleanup...');

  try {
    const now = new Date();
    const users = await User.find({ 'pointHistory.0': { $exists: true } });

    for (const user of users) {
      user.pointHistory = user.pointHistory.filter(entry => entry.expiresAt > now);

      user.referalpoints = user.pointHistory.reduce((sum, entry) => sum + entry.points, 0);

      await user.save();
    }

    console.log(`Referral points cleanup completed for ${users.length} users.`);
  } catch (error) {
    console.error('Error during referral points cleanup:', error);
  }
});
