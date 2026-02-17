const { createApp } = require('../backend/app');
const { testConnection } = require('../backend/config/database');
const { syncDatabase } = require('../backend/models/index');

const app = createApp();
let initializationPromise;

const initialize = async () => {
	if (!initializationPromise) {
		initializationPromise = (async () => {
			try {
				const connected = await testConnection();
				if (!connected) {
					throw new Error('Database connection failed');
				}

				app.locals.startupStatus.dbConnected = true;
				await syncDatabase();
				app.locals.startupStatus.dbSynced = true;
				app.locals.startupStatus.initialized = true;
				app.locals.startupStatus.initializedAt = new Date().toISOString();
				app.locals.startupStatus.lastError = null;
			} catch (error) {
				app.locals.startupStatus.lastError = error.message;
				throw error;
			}
		})();
	}

	return initializationPromise;
};

module.exports = async (req, res) => {
	try {
		await initialize();
		return app(req, res);
	} catch (error) {
		console.error('❌ API initialization failed:', error.message);
		return res.status(503).json({
			success: false,
			error: 'Service unavailable. Please try again shortly.'
		});
	}
};
