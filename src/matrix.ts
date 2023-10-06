class Matrix extends Array<Array<number>> {
    get cols() {
        return this[0].length;
    }

    get rows() {
        return this.length;
    }

    add(...others: Matrix[]) {
        others.forEach((other) => {
            for (let col = 0; col < this.cols; col++) {
                for (let row = 0; row < this.rows; row++) {
                    const this_value = this[row][col];
                    const other_value = other[row][col];
                    this[row][col] = this_value + other_value;
                }
            }
        });
        return this;
    }

    multiply(...others: Matrix[]) {

        return this;
    }
}
