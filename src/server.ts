import 'source-map-support/register';
import gracefulShutdown from 'http-graceful-shutdown';
import throng from 'throng';

import { createApp } from './app';

import { WEB_CONCURRENCY } from './config';

/**
 * Helper function to log an exit code before exiting the process.
 */
const logAndExitProcess = (exitCode: number) => {
    console.log(`Exiting process with exit code: ${exitCode}`);
    process.exit(exitCode);
};

/**
 * Sets up event listeners on unexpected errors and warnings. These should theoretically
 * never happen. If they do, we assume that the app is in a bad state. For errors, we
 * exit the process with code 1.
 */
const setupProcessEventListeners = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    process.on('unhandledRejection', (reason: any) => {
        console.log(`encountered unhandled rejection with reason: ${reason}`);
        logAndExitProcess(1);
    });

    process.on('uncaughtException', (err: Error) => {
        console.log(`encountered uncaught exception with the error: ${err}`);
        logAndExitProcess(1);
    });

    process.on('warning', (warning: Error) => {
        console.log(`encountered warning with message: ${warning}`);
    });
};

/**
 * Start an Express server and installs signal handlers on the
 * process for graceful shutdown.
 */
const startServer = async () => {
    try {
        const { app } = await createApp();
        const port = app.get('port');

        const server = app.listen(port, () => {
            console.log(`Started Express server in environment: ${app.get('env')} on port: ${port}`);
        });

        gracefulShutdown(server);
        setupProcessEventListeners();
    } catch (err) {
        console.error(`Error caught in server.ts, details: ${err}`);
    }
};

throng({
    start: startServer,
    count: WEB_CONCURRENCY
});
