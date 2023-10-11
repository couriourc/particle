/*备忘录*/
class Memento<T> {
    _state: T;
    _book: MementoBook<T>;

    constructor(state: T) {
        this._state = state;
        this._book = new MementoBook<T>(this);
        this.setState(state);
    }

    getState() {
        return this._state;
    }

    setState(state: T) {

    }

    snapshot() {
        return this.getState();
    }

    store() {
        return this._book.store(this._state);
    }

    /*销毁这个快照*/
    destroy() {

    }
}

class MementoBook<T> {
    #history: Memento<T>['_state'][] = [];
    #now: number = -1;
    #memento: Memento<T>;

    get curState() {
        return this.#history[this.#now];
    }

    /*进行书籍绑定*/
    constructor(memento: Memento<T>) {
        /*绑定观察元素*/
        this.#memento = memento;
        /*创建初始快照*/
        this.store(memento.snapshot());
    }

    isEmpty() {
        return !this.#history.length;
    }

    isSurpass() {
        return this.#now > this.#history.length;
    }

    last() {
        this.#now = this.#history.length - 1;
        return this.curState;
    }

    store(state: T) {
        ++this.#now;
        this.#history.push(state);
    }

    destroy() {
        this.#history = [];
    }

    undo() {
        if (this.isEmpty()) return this;
        this.#now--;
        return this;
    }

    revokeUndo() {
        if (this.isEmpty()) return null;
        if (this.isSurpass()) {
            return this.last();
        }
        this.#now++;
        return this;
    }

    /*恢复*/
    apply() {
        this.#memento.setState(this.curState);
    }
}

