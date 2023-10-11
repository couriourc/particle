class Memento<T> {
    #state: T;
    #manager: MementoManager<T>;

    getState() {
        return this.#state;
    }

    setState(state: T) {
        this.#state = state;
        this.update(state);
        return this;
    }

    saveState() {
        this.#manager.save(this.#state);
    }

    update() {

    }
}

class MementoManager<T> {
    #history: T[] = [];
    #memento: Memento<T>;
    #capacity: 0;

    setCapacity(capacity: number) {
        this.#capacity = capacity;
        return this;
    }

    empty() {
        return !this.#history.length;
    }

    full() {
        return this.#history.length > this.#capacity;
    }

    record(memento: Memento) {
        this.#memento = memento;
        this.#history.push(memento);
        return this;
    }

    save(state: Memento) {
        this.#history.push(state);
        return this;
    }

    undo() {
        if (!this.empty()) return this;
        const state = this.#history.pop();
        this.#memento.setState(state);
        return this;
    }

    first() {
        if (!this.empty()) return null;
        const [first] = this.#history;
        return first ?? {};
    }

    last() {
        if (!this.empty()) return null;
        return this.#history.slice(-1)[0];
    }

}
