/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Publisher from "./Publisher";
import Command, { ICommand, ICommandProps } from "./Command";

////////////////////////////////////////////////////////////////////////////////

export interface ICommandDispatcher
{
    dispatch: () => void;
}

export default class Commander extends Publisher
{
    protected static readonly defaultCapacity = 30;

    protected stack: ICommand[];
    protected pointer: number;
    protected capacity: number;

    constructor(capacity?: number)
    {
        super();
        this.addEvent("update");

        this.stack = [];
        this.pointer = -1;
        this.capacity = capacity !== undefined ? capacity : Commander.defaultCapacity;
    }

    register<T extends Function>(factory: (args: any[]) => Command<T>): T;
    register<T extends Function>(props: ICommandProps<T>): T;
    register<T extends Function>(propsOrFactory: any): T
    {
        let factory: (args: any[]) => Command<T>;

        if (typeof propsOrFactory === "function") {
            factory = propsOrFactory;
        }
        else {
            factory = (args: any[]) => new Command(args, propsOrFactory);
        }

        const action: any = (...args: any[]) => {
            const command = factory(args);
            this.do(command);
        };

        return action as T;
    }

    setCapacity(capacity: number)
    {
        this.capacity = capacity;

        while(this.stack.length > capacity) {
            this.stack.shift();
            this.pointer--;
        }

        if (this.pointer < 0) {
            this.stack = [];
            this.pointer = -1;
        }
    }

    do(command: ICommand)
    {
        console.log(`Commander.do - '${command.name}'`);
        
        command.do();

        if (command.canUndo()) {
            this.stack.splice(this.pointer + 1);
            this.stack.push(command);

            if (this.stack.length > this.capacity) {
                this.stack.shift();
            }

            this.pointer = this.stack.length - 1;

            this.emit("update");
        }
    }

    undo()
    {
        if (this.pointer >= 0) {
            const command = this.stack[this.pointer];
            command.undo();
            this.pointer--;

            this.emit("update");
        }
    }


    redo()
    {
        if (this.pointer < this.stack.length - 1) {
            this.pointer++;
            const command = this.stack[this.pointer];
            command.do();

            this.emit("update");
        }
    }

    clear()
    {
        if (this.stack.length > 0) {
            this.stack = [];
            this.pointer = -1;

            this.emit("update");
        }
    }

    canUndo(): boolean
    {
        return this.pointer >= 0;
    }

    canRedo(): boolean
    {
        return this.pointer < this.stack.length - 1;
    }

    getUndoText(): string
    {
        if (this.pointer >= 0) {
            return "Undo " + this.stack[this.pointer].name;
        }

        return "Can't Undo";
    }

    getRedoText(): string
    {
        if (this.pointer < this.stack.length - 1) {
            return "Redo " + this.stack[this.pointer + 1].name;
        }

        return "Can't Redo";
    }
}