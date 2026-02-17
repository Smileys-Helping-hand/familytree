const { testConnection } = require('../backend/config/database');

let app;
let initializationPromise;
const isServerlessRuntime = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

const getApp = () => {
	if (!app) {
		const { createApp } = require('../backend/app');
		app = createApp();
	}

	return app;
};

const initialize = async () => {
	if (!initializationPromise) {
		initializationPromise = (async () => {
			const appInstance = getApp();
			try {
				const connected = await testConnection();
				if (!connected) {
					throw new Error('Database connection failed');
				}

				appInstance.locals.startupStatus.dbConnected = true;
				if (isServerlessRuntime) {
					appInstance.locals.startupStatus.dbSynced = true;
				} else {
					const { syncDatabase } = require('../backend/models/index');
					await syncDatabase();
					appInstance.locals.startupStatus.dbSynced = true;
				}
				appInstance.locals.startupStatus.initialized = true;
				appInstance.locals.startupStatus.initializedAt = new Date().toISOString();
				appInstance.locals.startupStatus.lastError = null;
			} catch (error) {
				appInstance.locals.startupStatus.lastError = error.message;
				throw error;
			}
		})();
	}

	return initializationPromise;
};

module.exports = async (req, res) => {
	try {
		await initialize();
		return getApp()(req, res);
	} catch (error) {
		console.error('❌ API initialization failed:', error.message);
		return res.status(503).json({
			success: false,
			error: `Service unavailable. ${error.message}`
		});
	}
};
