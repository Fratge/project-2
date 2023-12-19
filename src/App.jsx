import { useEffect, useState, useRef } from 'react';

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader'; // Importez le chargeur GLTF
import './game.css'
import CannonDebugger from 'cannon-es-debugger';
import axios from 'axios';
import SceneInit from './lib/SceneInit';

function App() {
  const [compteur, setCompteur] = useState(0); 
  const [fuel, setFuel] = useState(100); // Starting fuel at 100%
  const fuelRef = useRef(fuel); // Créez une référence pour le carburant
  const [gameStarted, setGameStarted] = useState(false); // Ajouté
  const [timer, setTimer] = useState(0); // État pour le chronomètre
  const [showRestartButton, setShowRestartButton] = useState(false);
  const [jeuTempsData, setJeuTempsData] = useState([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const timerRef = useRef(timer);
  const [playerName, setPlayerName] = useState('');

const handleNameSubmit = (e) => {
  e.preventDefault();
  // Ajoutez ici la logique pour commencer le jeu
  setGameStarted(true);
};
  const handleReloadClick = () => {
    window.location.reload();
  };
  useEffect(() => {
    fuelRef.current = fuel;
  }, [fuel]);

  useEffect(() => {
    axios.get('http://localhost:3001/jeu_temps')
    .then(response => {
      console.log('Données reçues:', response.data);
      setJeuTempsData(response.data);
    })
    .catch(error => {
      console.error('Erreur lors de la récupération des données:', error);
    });
  
  }, []);
  
  function createCoin(globalMin, globalMax, monde, integrationCanvas) {
    const randomX = Math.random() * (globalMax.x - globalMin.x) + globalMin.x;
    const randomY = 2; // Position initiale au-dessus de la limite supérieure Y
    const randomZ = Math.random() * (globalMax.z - globalMin.z) + globalMin.z;
  
    const coinShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    const coinBody = new CANNON.Body({ mass: 0 }); // 0 = affecté par la gravité
    coinBody.addShape(coinShape);
    coinBody.position.set(randomX, randomY, randomZ);
    coinBody.isCoin = true;
    monde.addBody(coinBody);
  
    const material = new THREE.MeshLambertMaterial({ color: 0xFFFF00 }); // Jaune

    const geometry = new THREE.BoxGeometry(2, 2, 2); 
    const mesh = new THREE.Mesh(geometry, material);
  
    mesh.position.copy(coinBody.position);
    mesh.rotationSpeed = new THREE.Vector3(0, 0.05, 0); // Rotation de 0.05 radian par frame autour de l'axe Y

    mesh.position.copy(coinBody.position);
  
    integrationCanvas.scene.add(mesh);
    
  
    coinBody.threeMesh = mesh;
  
    monde.addBody(coinBody);
  }
  
  function createFuel(globalMin, globalMax, monde, integrationCanvas) {
    const randomX = Math.random() * (globalMax.x - globalMin.x) + globalMin.x;
    const randomY = 2; // Position initiale au-dessus de la limite supérieure Y
    const randomZ = Math.random() * (globalMax.z - globalMin.z) + globalMin.z;
  
    const fuelShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    const fuelBody = new CANNON.Body({ mass: 1 }); 
    fuelBody.addShape(fuelShape);
    fuelBody.position.set(randomX, randomY, randomZ);
    fuelBody.isFuel = true;
      
    monde.addBody(fuelBody);
  
    const material = new THREE.MeshLambertMaterial({ color: 0xff0000 }); // Rouge
  
    const geometry = new THREE.BoxGeometry(2, 2, 2); 
    const mesh = new THREE.Mesh(geometry, material);
  
    mesh.position.copy(fuelBody.position);
    mesh.rotationSpeed = new THREE.Vector3(0, 0.05, 0); // Rotation de 0.05 radian par frame autour de l'axe Y
  
    integrationCanvas.scene.add(mesh);
  
    const light = new THREE.PointLight(0xffffff, 1, 100); // Couleur blanche, intensité, distance
    light.position.copy(mesh.position);
    integrationCanvas.scene.add(light);
  
    fuelBody.threeMesh = mesh;
    fuelBody.threeLight = light;
    fuelBody.threeMesh = mesh;
  
    monde.addBody(fuelBody);
  }
  
  const postTimeData = (formattedTime) => {
    axios.post('http://localhost:3001/insert_time', {
      playerName,
      time: formattedTime
    })
    .then(response => console.log(response))
    .catch(error => console.error('Erreur lors de l’envoi des données:', error));
  };
  
  
  useEffect(() => {
    let fuelInterval = null;
    let intervalId;

    const integrationCanvas = new SceneInit('myThreeJsCanvas');

    integrationCanvas.initialize();
    integrationCanvas.animate();
    const axesHelper = new THREE.AxesHelper(8);
    integrationCanvas.scene.add(axesHelper);

    const loader = new GLTFLoader(); 

    // loader.load('../assets/test.gltf', (gltf) => {
    loader.load('/etudiants/2021/grosss/projet-2/assets/test.gltf', (gltf) => {
      const solModel = gltf.scene
      console.log(solModel)

      solModel.position.set(0, 0, 0);

      integrationCanvas.scene.add(solModel);
      
    });

    // loader.load('../assets/test.gltf', (gltf) => {
      loader.load('/etudiants/2021/grosss/projet-2/assets/test.gltf', (gltf) => {
      const scale = 1;
      console.log(gltf.scene);
  
      // Variables to store the global bounding box
      let globalMin = new THREE.Vector3(Infinity, Infinity, Infinity);
      let globalMax = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
      const treeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });

      gltf.scene.traverse(function (node) {
        console.log(node.name)
        if (node.isMesh) {
            const positions = node.geometry.attributes.position.array;
    
            // Compute bounding box for this mesh
            node.geometry.computeBoundingBox();
    
            // Update global bounding box
            globalMin.min(node.geometry.boundingBox.min);
            globalMax.max(node.geometry.boundingBox.max);
            
            const box = new CANNON.Box(new CANNON.Vec3(
                (node.geometry.boundingBox.max.x - node.geometry.boundingBox.min.x) * scale / 2,
                (node.geometry.boundingBox.max.y - node.geometry.boundingBox.min.y) * scale / 2,
                (node.geometry.boundingBox.max.z - node.geometry.boundingBox.min.z) * scale / 2
            ));
    
            let massValue = 0; // Default mass
    
            // If the node name is "Arbre", set its mass to 0 (making it static)
            if (node.name === "Arbre") {
                node.material = treeMaterial;

                massValue = 0;
            }
    
            const body = new CANNON.Body({ mass: massValue });
            body.addShape(box);
            body.position.set(node.position.x, node.position.y, node.position.z);
            body.quaternion.set(node.quaternion.x, node.quaternion.y, node.quaternion.z, node.quaternion.w);
    
            monde.addBody(body);
        }
    });
  
    // Création des pièces
    for (let i = 0; i < 15; i++) {
      createCoin(globalMin, globalMax, monde, integrationCanvas); 
    }

    // Création des bidons d'essences
    for (let i = 0; i < 15; i++) {
      createFuel(globalMin, globalMax, monde, integrationCanvas); 
    }

    });


    // Initialisation du monde, avec une gravité de -9.82 sur l'axe Y
    const monde = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0),
    });

    // Ajout du debugger de Cannon.js
    const cannonDebugger = new CannonDebugger(integrationCanvas.scene, monde);

    const couleurCorpsVoiture = 0x0008FF; // Bleu

    const corpsVoiture = new CANNON.Body({
      mass: 5, //Poids du véhicule
      position: new CANNON.Vec3(0, 12, 0), // 0 = axe X, 12 = axe Y,  = axe Z
      shape: new CANNON.Box(new CANNON.Vec3(5, 0.5, 2)), // 4 = largeur, 0.5 = hauteur, 2 = profondeur
    });

    const voiture = new CANNON.RigidVehicle({
      chassisBody: corpsVoiture,
    });

    integrationCanvas.voiture = corpsVoiture; // Ajoutez ceci pour garder une référence à la voiture


    // Roues du véhicule
    const mass = 2;
    const largeurAxe = 15;
    const formeRoue = new CANNON.Sphere(1.5); // Rayon de la roue de 1 d'unité
    const couleurRoue = 0xFF2D00; // Rouge
    const materielRoue = new CANNON.Material('wheel');
    const down = new CANNON.Vec3(0, -1, 0);

    const roueAvantGauche = new CANNON.Body({ mass, material: materielRoue });
    roueAvantGauche.addShape(formeRoue);
    roueAvantGauche.angularDamping = 0.4;
    voiture.addWheel({
      body: roueAvantGauche,
      position: new CANNON.Vec3(-3, 0, largeurAxe / 6.5),
      axis: new CANNON.Vec3(0, 0, 1),
      direction: down,
    });

    const roueAvantDroit = new CANNON.Body({ mass, material: materielRoue });
    roueAvantDroit.addShape(formeRoue);
    roueAvantDroit.angularDamping = 0.4;
    voiture.addWheel({
      body: roueAvantDroit,
      position: new CANNON.Vec3(-3, 0, -largeurAxe / 6.5),
      axis: new CANNON.Vec3(0, 0, 1),
      direction: down,
    });

    const roueArriereGauche = new CANNON.Body({ mass, material: materielRoue });
    roueArriereGauche.addShape(formeRoue);
    roueArriereGauche.angularDamping = 0.4;
    voiture.addWheel({
      body: roueArriereGauche,
      position: new CANNON.Vec3(3, 0, largeurAxe / 6.5),
      axis: new CANNON.Vec3(0, 0, 1),
      direction: down,
    });

    const roueArriereDroit = new CANNON.Body({ mass, material: materielRoue });
    roueArriereDroit.addShape(formeRoue);
    roueArriereDroit.angularDamping = 0.4;
    voiture.addWheel({
      body: roueArriereDroit,
      position: new CANNON.Vec3(3, 0, -largeurAxe / 6.5),
      axis: new CANNON.Vec3(0, 0, 1),
      direction: down,
    });

    voiture.addToWorld(monde);

    
    const handleKeyDown = (event) => {
      if (!gameStarted || fuelRef.current <= 0) return; // Ne rien faire si le jeu n'a pas commencé ou si le carburant est à 0

      const maxSteerVal = Math.PI / 8;
        const maxForce = 25;
        switch (event.key) {
          case 'w':
          case 'ArrowUp':
            voiture.setWheelForce(maxForce, 0);
            voiture.setWheelForce(maxForce, 1);
            break;
    
          case 's':
          case 'ArrowDown':
            voiture.setWheelForce(-maxForce / 2, 0);
            voiture.setWheelForce(-maxForce / 2, 1);
            break;
    
          case 'a':
          case 'ArrowLeft':
            voiture.setSteeringValue(maxSteerVal, 0);
            voiture.setSteeringValue(maxSteerVal, 1);
            break;
    
          case 'd':
          case 'ArrowRight':
            voiture.setSteeringValue(-maxSteerVal, 0);
            voiture.setSteeringValue(-maxSteerVal, 1);
            break;
          
          case 'R':
          case 'r':
            corpsVoiture.position.set(0, 8, 0);
            break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // reset car force to zero when key is released
    document.addEventListener('keyup', (event) => {
      switch (event.key) {
        case 'w':
        case 'ArrowUp':
          voiture.setWheelForce(0, 0);
          voiture.setWheelForce(0, 1);
          break;

        case 's':
        case 'ArrowDown':
          voiture.setWheelForce(0, 0);
          voiture.setWheelForce(0, 1);
          break;

        case 'a':
        case 'ArrowLeft':
          voiture.setSteeringValue(0, 0);
          voiture.setSteeringValue(0, 1);
          break;

        case 'd':
        case 'ArrowRight':
          voiture.setSteeringValue(0, 0);
          voiture.setSteeringValue(0, 1);
          break;
      }
    });

    // Modelisation du véhicule
    const boxGeometry = new THREE.BoxGeometry(10, 2.5, 4);
    // const boxMaterial = new THREE.MeshNormalMaterial();
    const boxMaterial = new THREE.MeshBasicMaterial({ color: couleurCorpsVoiture }); // Utilisez un matériau coloré
    const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
    integrationCanvas.scene.add(boxMesh);

    const sphereGeometry1 = new THREE.SphereGeometry(1.5);
    // const sphereMaterial1 = new THREE.MeshNormalMaterial();
    const sphereMaterial1 = new THREE.MeshBasicMaterial({ color: couleurRoue });
    const sphereMesh1 = new THREE.Mesh(sphereGeometry1, sphereMaterial1);
    integrationCanvas.scene.add(sphereMesh1);

    const sphereGeometry2 = new THREE.SphereGeometry(1.5);
    // const sphereMaterial2 = new THREE.MeshNormalMaterial();
    const sphereMaterial2 = new THREE.MeshBasicMaterial({ color: couleurRoue });
    const sphereMesh2 = new THREE.Mesh(sphereGeometry2, sphereMaterial2);
    integrationCanvas.scene.add(sphereMesh2);

    const sphereGeometry3 = new THREE.SphereGeometry(1.5);
    // const sphereMaterial3 = new THREE.MeshNormalMaterial();
    const sphereMaterial3 = new THREE.MeshBasicMaterial({ color: couleurRoue });
    const sphereMesh3 = new THREE.Mesh(sphereGeometry3, sphereMaterial3);
    integrationCanvas.scene.add(sphereMesh3);

    const sphereGeometry4 = new THREE.SphereGeometry(1.5);
    // const sphereMaterial4 = new THREE.MeshNormalMaterial();
    const sphereMaterial4 = new THREE.MeshBasicMaterial({ color: couleurRoue });
    const sphereMesh4 = new THREE.Mesh(sphereGeometry4, sphereMaterial4);
    integrationCanvas.scene.add(sphereMesh4);

    const isVehicleMoving = () => {
      return corpsVoiture.velocity.lengthSquared() > 0.5;
    };

    const reduceFuel = () => {
      setFuel((prevFuel) => Math.max(prevFuel - 1, 0)); // Réduit le carburant de 10% jusqu'à 0
    };
    
    const animate = () => {
      window.requestAnimationFrame(animate);
      monde.step(2 / 60); // step the physics world
    
      monde.fixedStep();
      cannonDebugger.update();
    
      // Mettez à jour la position et le quaternion de chaque cube Three.js
      // for (let i = 0; i < monde.bodies.length; i++) {
      //   const body = monde.bodies[i];
      //   if (body.threeMesh) {
      //     body.threeMesh.position.copy(body.position);
      //     body.threeMesh.quaternion.copy(body.quaternion);
      //   }
      // }

      if (fuelRef.current <= 0) {
        voiture.setWheelForce(0, 0);
        voiture.setWheelForce(0, 1);
      } 

      monde.bodies.forEach((body, index) => {
        if (body.isCoin) {
          const distance = corpsVoiture.position.vsub(body.position).length();
          if (distance < 6) {
            integrationCanvas.scene.remove(body.threeMesh);
            monde.removeBody(body);
            
            setCompteur(compteur => {
              const newCount = compteur + 1;
              if (newCount === 1) {
                const currentTimerValue = timerRef.current;
                const formattedTime = formatTime(currentTimerValue);
                postTimeData(formattedTime);
                setIsGameOver(true);
                setGameStarted(false);
              }
              return newCount;
            });
            
          }
        }
      
        if (body.isFuel) {
          const distance = corpsVoiture.position.vsub(body.position).length();
          if (distance < 6) {
            setFuel((prevFuel) => Math.min(prevFuel + 10, 100)); 
            monde.removeBody(body);
            integrationCanvas.scene.remove(body.threeMesh);
          }
        }
      });
      
      monde.bodies.forEach(function(body) {
        if (body.isCoin && body.threeMesh) {
          body.threeMesh.rotation.x += body.threeMesh.rotationSpeed.x;
          body.threeMesh.rotation.y += body.threeMesh.rotationSpeed.y;
          body.threeMesh.rotation.z += body.threeMesh.rotationSpeed.z;
        }
      });
    
      boxMesh.position.copy(corpsVoiture.position);
      boxMesh.quaternion.copy(corpsVoiture.quaternion);
      sphereMesh1.position.copy(roueAvantGauche.position);
      sphereMesh1.quaternion.copy(roueAvantGauche.quaternion);
      sphereMesh2.position.copy(roueAvantDroit.position);
      sphereMesh2.quaternion.copy(roueAvantDroit.quaternion);
      sphereMesh3.position.copy(roueArriereGauche.position);
      sphereMesh3.quaternion.copy(roueArriereGauche.quaternion);
      sphereMesh4.position.copy(roueArriereDroit.position);
      sphereMesh4.quaternion.copy(roueArriereDroit.quaternion);

      if (isVehicleMoving()) {
        if (!fuelInterval) {
          fuelInterval = setInterval(reduceFuel, 500);
        }
      } else {
        if (fuelInterval) {
          clearInterval(fuelInterval);
          fuelInterval = null;
        }
      }
      if (fuelRef.current <= 0) {
        voiture.setWheelForce(0, 0);
        voiture.setWheelForce(0, 1);
        setShowRestartButton(true); // Afficher le bouton de redémarrage
      }
    };

    

    animate();
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (intervalId) {
        clearInterval(intervalId); 
      }
    };
    
    
  }, [gameStarted]);

  useEffect(() => {
    let intervalId;
    if (gameStarted) {
      intervalId = setInterval(() => {
        setTimer(prevTime => {
          console.log('Mise à jour du timer:', prevTime + 10);
          return prevTime + 10;
        });
      }, 10);
    }
  
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [gameStarted]);

  const startGame = () => {
    setGameStarted(true); // Commencer le jeu lorsque le bouton est pressé
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const milliseconds = Math.floor((time % 1000) / 10);

    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}:${milliseconds < 10 ? '0' : ''}${milliseconds}`;
  };;

  const restartGame = () => {
    setFuel(100); // Réinitialiser le carburant
    setCompteur(0); // Réinitialiser le compteur
    setTimer(0); // Réinitialiser le timer
    setShowRestartButton(false); // Cacher le bouton de redémarrage
    setGameStarted(false); // Arrêter le jeu
  };

  useEffect(() => {
    timerRef.current = timer; // Mettez à jour la référence à chaque modification du timer
  }, [timer]);

  return (
    <div>
      {!gameStarted && !isGameOver && (
        <div className='start-button'>
          <div>
          <form onSubmit={handleNameSubmit} style={{ display: 'flex', flexDirection: 'column'}}>
            <input 
              type="text" 
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value)} 
              placeholder="Entrez votre pseudo" 
              style={{ color:'black' }}
            />
            <button type="submit">Commencer la partie</button>
          </form>
            {/* <button onClick={startGame}>Commencer</button> */}
          </div>
        </div>
      )}
      {showRestartButton && (
        <div className='start-button'>
          <button onClick={handleReloadClick} >Revenir à l'accueil</button>
        </div>
      )}
      {gameStarted && (
        <div className='timer'>
          {formatTime(timer)}
        </div>
      )}
      {isGameOver && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', fontSize: '24px' }}>
          Bravo ! Vous avez collecté 15 pièces !
          <div>
            <button onClick={handleReloadClick}>Revenir à l'accueil</button>
          </div>
        </div>
      )}
      <div style={{ position: 'absolute', top: 0, right: 0, padding: '10px', fontSize: '24px', color: 'white' }}>
        {compteur} / 15 pièces
      </div>
      <div style={{ position: 'absolute', top: 35, right: 0, padding: '10px', fontSize: '24px', color: 'white' }}>
        {fuel} % FUEL
      </div>
      <div style={{ position: 'absolute', top: 35, left: 0, padding: '10px', fontSize: '24px', color: 'white', backgroundColor: 'grey' }}>
        <h1>Classement des joueurs</h1>
        <ul>
        {jeuTempsData.map((item, index) => (
        <li key={index}>
          {item.jeu_fg_joueur}: {item.jeu_score_temps}
        </li>
      ))}
        </ul>
      </div>
      <canvas id="myThreeJsCanvas" />
    </div>
  );
}

export default App;
