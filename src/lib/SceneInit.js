import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module';

export default class SceneInit {
  constructor(canvasId) {
    // NOTE: Core components to initialize Three.js app.
    this.scene = undefined;
    this.camera = undefined;
    this.renderer = undefined;

    // NOTE: Camera params;
    this.fov = 45;
    this.nearPlane = 100;
    this.farPlane = 1000;
    this.canvasId = canvasId;

    // NOTE: Additional components.
    this.clock = undefined;
    this.stats = undefined;
    this.controls = undefined;

    // NOTE: Lighting is basically required.
    this.ambientLight = undefined;
    this.directionalLight = undefined;
  }

  initialize() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    this.camera.position.z = 24;
    this.camera.position.y = 8;

    // NOTE: Specify a canvas which is already created in the HTML.
    const canvas = document.getElementById(this.canvasId);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      // NOTE: Anti-aliasing smooths out the edges.
      antialias: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.stats = Stats();
    document.body.appendChild(this.stats.dom);

    // ambient light which is for the whole scene
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.ambientLight.castShadow = true;
    this.scene.add(this.ambientLight);

    // directional light - parallel sun rays
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    // this.directionalLight.castShadow = true;
    this.directionalLight.position.set(0, 32, 64);
    this.scene.add(this.directionalLight);

    window.addEventListener('resize', () => this.onWindowResize(), false);

    // this.loader = new THREE.TextureLoader();
    // this.scene.background = this.loader.load('./test.jpg');
  }
  voiture = undefined; 
  suivreCam = true;
  animate(updateFunc) {
    window.requestAnimationFrame(() => this.animate(updateFunc));
    
    if (this.suivreCam && this.voiture) {
      let offset = new THREE.Vector3(10, 7.5, 25); // Valeurs réduites de moitié par exemple
      const carPosition = new THREE.Vector3(
        this.voiture.position.x,
        this.voiture.position.y,
        this.voiture.position.z
      );
      const carOrientation = new THREE.Quaternion(
        this.voiture.quaternion.x,
        this.voiture.quaternion.y,
        this.voiture.quaternion.z,
        this.voiture.quaternion.w
      );
  
      // Créer une matrice de rotation pour tourner l'offset
      const rotationMatrix = new THREE.Matrix4();
      const yAxis = new THREE.Vector3(0, 4, 0); // Axe autour duquel effectuer la rotation (axe y)
      const angle = THREE.MathUtils.degToRad(30); // Angle de rotation en degrés converti en radians
      rotationMatrix.makeRotationAxis(yAxis, angle);
      
      offset.applyMatrix4(rotationMatrix);
      offset.applyQuaternion(carOrientation);
      
      // Mise à jour de la position de la camera chaque frame
      this.camera.position.copy(carPosition).add(offset);
      
      // Caméra qui regarde toujours la voiture
      this.camera.lookAt(carPosition);
    }
  
    if (updateFunc) {
      updateFunc();
    }
    this.stats.update();
    this.render();
    this.controls.update();
  }
  
  



  render() {
    // NOTE: Update uniform data on each render.
    // this.uniforms.u_time.value += this.clock.getDelta();
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }


}
