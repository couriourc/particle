/*备忘录模式*/
export class Memento<T> {
    state: T;

    initState(state: T) {
        this.state = state;
    }

    constructor(state?: T) {
        Object.assign(this.state, state ?? {});
    }

    snapshot() {
        /*执行快照*/
        return new Memento(JSON.parse(JSON.stringify(this.state)));
    }

}

export class MementoManager<T> {
    history: Memento<T>[] = [];

    store(target: Memento<T>) {
        /*保存快照*/
        this.history.push(target.snapshot());
    }

    /*获取索引号*/
    restore(index: number) {
        /*恢复快照*/
        return this.history[index];
    }

    undo() {
        return this.history.pop();
    }

    first() {
        const [first] = this.history;
        return first;
    }

    last() {
        return this.history.slice(-1)[0];
    }

    length() {
        return this.history.length;
    }
}


