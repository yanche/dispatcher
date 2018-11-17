
import { DispatcherClient } from "../dclient";
import { DispatchAsk, Action, Task, status } from "../def";
import * as utility from "../utility";

export interface ConsumeAction {
    (action: Action, task: Task, dclient: DispatcherClient): Promise<any>;
}

export class Consumer {
    private _started: boolean;
    private _stopping: Promise<void>;
    private _stopres: () => void;

    private readonly _consumerRequirement: () => Promise<DispatchAsk>;
    private readonly _client: DispatcherClient;
    private readonly _idol: Idol;
    private readonly _consumerAction: ConsumeAction;

    constructor(options: Readonly<{
        host: string;
        port: number;
        useHTTPS?: boolean;
        ignoreInvalidHttpsCert?: boolean;
        requirement: () => Promise<DispatchAsk>;
        consumeAct: ConsumeAction
    }>) {
        this._consumerRequirement = options.requirement;
        this._client = new DispatcherClient(options);
        this._idol = new Idol();
        this._consumerAction = options.consumeAct;
        this._started = false;
        this._stopping = this._stopres = null;
    }

    public start(): void {
        if (this._started) {
            throw new Error("consumer already started");
        }
        else {
            this._started = true;
            const that = this;
            (function loop() {
                utility.delay(that._idol.current())
                    .then(() => that._work())
                    .catch((err: Error) => {
                        console.error(`unhandled error in consumer: ${err.message}`);
                        console.error(err.stack);
                        that._idol.breakMore();
                    })
                    .then(() => {
                        if (that._stopping) {
                            that._stopres();
                            that._stopres = that._stopping = null;
                            that._started = false;
                        }
                        else {
                            loop();
                        }
                    });
            })();
        }
    }

    public stop(): Promise<void> {
        if (this._started) {
            console.log("consumer will stop running when current task is finished");
            if (this._stopping) {
                return this._stopping;
            }
            else {
                return this._stopping = new Promise<void>(res => this._stopres = res);
            }
        }
        else {
            return Promise.resolve<void>(null);
        }
    }

    private async _work(): Promise<void> {
        let task: Task;

        try {
            const requirement = await this._consumerRequirement();
            task = await this._client.dispatch(requirement);
        }
        catch (err) {
            console.error(err.stack);
            console.log("failed to get a task from dispatcher");
            this._idol.breakMore();
            return;
        }

        if (!task) {
            console.log("no task from dispatcher, now waiting");
            this._idol.breakMore();
            return;
        }

        this._idol.hurry();

        try {
            const result = await this._consumerAction(task.action, task, this._client);
            try {
                await this._client.report({ processTs: task.lastProcessTs, statusId: status.success, _id: task._id, result: result })
                console.info(`task finished: ${task._id}, ${task.comments}`);
            }
            catch (err) {
                // the task may be marked as timeout at dispatcher server
                console.error(`!!!CRITICAL!!! failed to report task success to server: ${err.message}`);
                console.error(err.stack);
            };
        }
        catch (err) {
            console.error(err.stack);
            try {
                await this._client.report({ processTs: task.lastProcessTs, statusId: status.failed, errmsg: err.stack, _id: task._id });
                console.info(`task failed: ${task._id}, ${task.comments}`);
            }
            catch (err) {
                // the task may be marked as timeout at dispatcher server
                console.error(`!!!CRITICAL!!! failed to report task failure to server: ${err.message}`);
                console.error(err.stack);
            }
        }
    }
}

class Idol {
    private _idols = [0, 5000, 20000];
    private _idx = 0;

    public breakMore(): number {
        if (this._idx < this._idols.length - 1) this._idx++;
        return this.current();
    }
    public current(): number {
        return this._idols[this._idx];
    }
    public hurry(): number {
        this._idx = 0;
        return this.current();
    }
}
