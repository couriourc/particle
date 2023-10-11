import {Vector2} from "three";

class HyperParticleStatusMemo<T extends Vector2> extends Memento<T> {
    #state = new Vector2();
}

class HyperParticleStatus extends Vector2 {
    scale: Vector2 = new Vector2();
}

class HyperParticle {

}
