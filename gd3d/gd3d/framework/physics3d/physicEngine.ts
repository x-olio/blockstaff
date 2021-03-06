namespace gd3d.framework
{

    export interface PhysicsImpostorJoint {
        mainImpostor: PhysicsImpostor;
        connectedImpostor: PhysicsImpostor;
        joint: PhysicsJoint;
    }

    export class PhysicsEngine {

        public gravity: math.vector3;

        /**
         * Creates a new Physics Engine
         * @param gravity defines the gravity vector used by the simulation
         * @param _physicsPlugin defines the plugin to use (CannonJS by default)
         */
        constructor(gravity:math.vector3=null, private _physicsPlugin: IPhysicsEnginePlugin = new CannonJSPlugin()) {
            if (!this._physicsPlugin.isSupported()) {
                throw new Error("Physics Engine " + this._physicsPlugin.name + " cannot be found. "
                    + "Please make sure it is included.")
            }
            gravity = gravity || new math.vector3(0, -9.807, 0)
            this.setGravity(gravity);
            this.setTimeStep();
        }

        /**
         * Sets the gravity vector used by the simulation
         * @param gravity defines the gravity vector to use
         */
        public setGravity(gravity: math.vector3): void {
            this.gravity = gravity;
            this._physicsPlugin.setGravity(this.gravity);
        }

        /**
         * Set the time step of the physics engine.
         * default is 1/60.
         * To slow it down, enter 1/600 for example.
         * To speed it up, 1/30
         * @param {number} newTimeStep the new timestep to apply to this world.
         */
        public setTimeStep(newTimeStep: number = 1 / 60) {
            this._physicsPlugin.setTimeStep(newTimeStep);
        }

        /**
         * Get the time step of the physics engine.
         */
        public getTimeStep(): number {
            return this._physicsPlugin.getTimeStep();
        }

        /**
         * dispose all impostor of the physics engine.
         */
        public dispose(): void {
            this._impostors.forEach(function (impostor) {
                impostor.dispose();
            })
            this._physicsPlugin.dispose();
        }

        public getPhysicsPluginName(): string {
            return this._physicsPlugin.name;
        }

        // Statics
        public static Epsilon = 0.001;

        //new methods and parameters

        private _impostors: Array<PhysicsImpostor> = [];
        private _joints: Array<PhysicsImpostorJoint> = [];
        
        /**
         * Adding a new impostor for the impostor tracking.
         * This will be done by the impostor itself.
         * @param {PhysicsImpostor} impostor the impostor to add
         */
        public addImpostor(impostor: PhysicsImpostor) {
            impostor.uniqueId = this._impostors.push(impostor);
            //if no parent, generate the body
            // if (!impostor.parent) {
            //     this._physicsPlugin.generatePhysicsBody(impostor);
            // }

            this._physicsPlugin.generatePhysicsBody(impostor);
        }

        /**
         * Remove an impostor from the engine.
         * This impostor and its mesh will not longer be updated by the physics engine.
         * @param {PhysicsImpostor} impostor the impostor to remove
         */
        public removeImpostor(impostor: PhysicsImpostor) {
            var index = this._impostors.indexOf(impostor);
            if (index > -1) {
                var removed = this._impostors.splice(index, 1);
                //Is it needed?
                if (removed.length) {
                    //this will also remove it from the world.
                    removed[0].physicsBody = null;
                }
            }
        }

        /**
         * Add a joint to the physics engine
         * @param {PhysicsImpostor} mainImpostor the main impostor to which the joint is added.
         * @param {PhysicsImpostor} connectedImpostor the impostor that is connected to the main impostor using this joint
         * @param {PhysicsJoint} the joint that will connect both impostors.
         */
        public addJoint(mainImpostor: PhysicsImpostor, connectedImpostor: PhysicsImpostor, joint: PhysicsJoint) {
            var impostorJoint = {
                mainImpostor: mainImpostor,
                connectedImpostor: connectedImpostor,
                joint: joint
            }
            joint.physicsPlugin = this._physicsPlugin;
            this._joints.push(impostorJoint);
            this._physicsPlugin.generateJoint(impostorJoint);
        }

        /**
         * Removes a joint from the simulation
         * @param mainImpostor defines the impostor used with the joint
         * @param connectedImpostor defines the other impostor connected to the main one by the joint
         * @param joint defines the joint to remove
         */
        public removeJoint(mainImpostor: PhysicsImpostor, connectedImpostor: PhysicsImpostor, joint: PhysicsJoint) {
            var matchingJoints = this._joints.filter(function (impostorJoint) {
                return (impostorJoint.connectedImpostor === connectedImpostor
                    && impostorJoint.joint === joint
                    && impostorJoint.mainImpostor === mainImpostor)
            });
            if (matchingJoints.length) {
                this._physicsPlugin.removeJoint(matchingJoints[0]);
                //TODO remove it from the list as well

            }
        }

        /**
         * Called by the scene. no need to call it.
         */
        public _step(delta: number) {
            //check if any mesh has no body / requires an update
            this._impostors.forEach((impostor) => {

                if (impostor.isBodyInitRequired()) {
                    this._physicsPlugin.generatePhysicsBody(impostor);
                }
            });

            if (delta > 0.1) {
                delta = 0.1;
            } else if (delta <= 0) {
                delta = 1.0 / 60.0;
            }

            this._physicsPlugin.executeStep(delta, this._impostors);

            // this._impostors.forEach((impostor) => {
            //     this._physicsPlugin.setTransformationFromPhysicsBody(impostor);
            // });

        }

        /**
         * Gets the current plugin used to run the simulation
         * @returns current plugin
         */
        public getPhysicsPlugin(): IPhysicsEnginePlugin {
            return this._physicsPlugin;
        }
        /**
         * Gets the list of physic impostors
         * @returns an array of PhysicsImpostor
         */
        public getImpostors(): Array<PhysicsImpostor> {
            return this._impostors;
        }

        /**
         * Gets the impostor for a physics enabled object
         * @param object defines the object impersonated by the impostor
         * @returns the PhysicsImpostor or null if not found
         */
        public getImpostorForPhysicsObject(object: transform): PhysicsImpostor {
            for (var i = 0; i < this._impostors.length; ++i) {
                if (this._impostors[i].object === object) {
                    return this._impostors[i];
                }
            }

            return null;
        }

        /**
         * Gets the impostor for a physics body object
         * @param body defines physics body used by the impostor
         * @returns the PhysicsImpostor or null if not found
         */
        public getImpostorWithPhysicsBody(body: any): PhysicsImpostor {
            for (var i = 0; i < this._impostors.length; ++i) {
                if (this._impostors[i].physicsBody === body) {
                    return this._impostors[i];
                }
            }

            return null;
        }



    }

    export interface IPhysicsEnginePlugin {
        world: any;
        name: string;
        setGravity(gravity: math.vector3): void;
        setTimeStep(timeStep: number): void;
        getTimeStep(): number;
        executeStep(delta: number, impostors: Array<PhysicsImpostor>): void; //not forgetting pre and post events
        applyImpulse(impostor: PhysicsImpostor, force: math.vector3, contactPoint: math.vector3): void;
        applyForce(impostor: PhysicsImpostor, force: math.vector3, contactPoint: math.vector3): void;
        generatePhysicsBody(impostor: PhysicsImpostor): void;
        removePhysicsBody(impostor: PhysicsImpostor): void;
        generateJoint(joint: PhysicsImpostorJoint): void;
        removeJoint(joint: PhysicsImpostorJoint): void;
        isSupported(): boolean;
        setTransformationFromPhysicsBody(impostor: PhysicsImpostor): void;
        setPhysicsBodyTransformation(impostor: PhysicsImpostor, newPosition: math.vector3, newRotation: math.quaternion): void;
        setLinearVelocity(impostor: PhysicsImpostor, velocity: math.vector3): void;
        setAngularVelocity(impostor: PhysicsImpostor, velocity: math.vector3): void;
        getLinearVelocity(impostor: PhysicsImpostor): math.vector3;
        getAngularVelocity(impostor: PhysicsImpostor): math.vector3;
        setBodyMass(impostor: PhysicsImpostor, mass: number): void;
        getBodyMass(impostor: PhysicsImpostor): number;
        getBodyFriction(impostor: PhysicsImpostor): number;
        setBodyFriction(impostor: PhysicsImpostor, friction: number): void;
        getBodyRestitution(impostor: PhysicsImpostor): number;
        setBodyRestitution(impostor: PhysicsImpostor, restitution: number): void;
        sleepBody(impostor: PhysicsImpostor): void;
        isSleeping(impostor: PhysicsImpostor) : boolean;
        wakeUpBody(impostor: PhysicsImpostor): void;
        //Joint Update
        updateDistanceJoint(joint: PhysicsJoint, maxDistance:number, minDistance?: number): void;
        setMotor(joint: IMotorEnabledJoint, speed: number, maxForce?: number, motorIndex?: number): void;
        setLimit(joint: IMotorEnabledJoint, upperLimit: number, lowerLimit?: number, motorIndex?: number): void;
        getRadius(impostor: PhysicsImpostor):number;
        getBoxSizeToRef(impostor: PhysicsImpostor, result:math.vector3): void;
        //syncMeshWithImpostor(mesh:AbstractMesh, impostor:PhysicsImpostor): void;
        dispose(): void;
    }
    
}
