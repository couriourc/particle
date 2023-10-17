export class EventListener<T> {
    #listeners: Map<T, Set<Function>> = new Map();

    on(typename: T, listener: Function) {
        if (!this.#listeners.has(typename)) {
            this.#listeners.set(typename, new Set<Function>([listener]));
        } else {
            this.#listeners.set(typename, this.#listeners.get(typename).add(listener));
        }
        return this;
    }

    emit(typename: T, ...args: any[]) {
        this.#listeners.get(typename)?.forEach(fn => {
            fn(...args);
        });
        return this;
    }
}

export class StateMachine<T> extends EventListener<'update'> {
    #state: T = null;
    #manager: StateMachineManager<T> = null;

    constructor(initialState: Partial<T>) {
        super();
        this.setState(initialState);
    }

    setState(state: Partial<T>) {
        Object.assign(this.#state, state);
        this.emit('update', this.#state);
    }

    getState() {
        return this.#state;
    }

    setManager(manager: StateMachineManager<T>) {
        this.#manager = manager;
    }
}

export class StateMachineManager<T> extends EventListener<'undo' | 'forward'> {
    #history: T[] = [];
    #observer: StateMachine<T>;
    #now: number = this.#history.length;

    constructor(observer: StateMachine<T>) {
        super();
        observer.setManager(this);
        this.#observer = observer;
        this.backup();
    }

    backup() {
        this.#history.push(this.#observer.getState());
        return this;
    }

    undo() {
        if (this.#now < 0) return this;
        const state = this.#history[this.#now--];
        this.#observer.setState(state);
        this.emit('undo');
        return this;
    }

    forward() {
        if (this.#now > this.#history.length) return this;
        const state = this.#history[++this.#now];
        this.#observer.setState(state);
        this.emit('forward');
        return this;
    }
}
