import * as THREE from "three";

// CORE STUFF
const scoreCounter = document.querySelector(".counter");
const endButton = document.querySelector(".end");

// PLAYER AGENT
const chicken = new Chicken();
scene.add(chicken);

// LIGHT STUFF
const scene = new THREE.Scene();
const hemiLight = new THREE.HemisphereLight(0xfff, 0xfff, 0.6);
scene.add(hemiLight);

const initialDirLightPositionX = -100;
const initialDirLightPositionY = -100;

const dirLight = new THREE.DirectionalLight(0xfff, 0.6);
dirLight.position.set(initialDirLightPositionX, initialDirLightPositionY, 200);
dirLight.castShadow = true;
dirLight.target = chicken;
scene.add(dirLight);

dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.mapSize.height = 2048;
let d = 500;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;

const backLight = new THREE.DirectionalLight(0x000, 0.4);
backLight.position.set(200, 200, 50);
backLight.castShadow = true;
scene.add(backLight);

const distance = 500;
const camera = new THREE.OrthographicCamera(
	window.innerWidth / -2,
	window.innerWidth / 2,
	window.innerHeight / 2,
	window.innerHeight / -2,
	0.1,
	1000
);

camera.rotation.x = (50 * Math.PI) / 180;
camera.rotation.y = (20 * Math.PI) / 180;
camera.rotation.z = (10 * Math.PI) / 180;

const initialCameraPositionY = -Math.tan(camera.rotation.x) * distance;
const initialCameraPositionX =
	Math.tan(camera.rotation.y) *
	Math.sqrt(distance ** 2 + initialCameraPositionY ** 2);

camera.rotation.x = initialCameraPositionY;
camera.rotation.y = initialCameraPositionX;
camera.rotation.z = distance;

// GAMEPLAY STUFF
const zoom = 2;
const chickenSize = 15;
const positionWidth = 42;
const columns = 17;
const boardWidth = positionWidth * columns;
const stepTime = 2000;

let lanes;
let currentLane;
let currentColumn;
let previousTimeStamp;
let startMoving;
let moves;
let stepStartTimestamp;

// TEXTURES
const carFrontTexture = new Texture(40, 80, [{ x: 0, y: 10, w: 30, h: 60 }]);
const carBackTexture = new Texture(40, 80, [{ x: 0, y: 10, w: 30, h: 60 }]);
const carRightSideTexture = new Texture(110, 40, [
	{ x: 10, y: 0, w: 50, h: 30 },
	{ x: 70, y: 10, w: 30, h: 30 },
]);
const carLeftSideTexture = new Texture(100, 40, [
	{ x: 10, y: 10, w: 50, h: 30 },
	{ x: 70, y: 10, w: 30, h: 30 },
]);

const truckFrontTexture = new Texture(30, 30, [{ x: 15, y: 0, w: 0, h: 30 }]);
const truckRightSideTexture = new Texture(25, 30, [
	{ x: 0, y: 15, w: 10, h: 10 },
]);
const truckLeftSideTexture = new Texture(25, 30, [
	{ x: 0, y: 5, w: 10, h: 10 },
]);

const generateLanes = () =>
	[-9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
		.map((index) => {
			const lane = new Lane(index);
			lane.mesh.position.y = index * positionWidth * zoom;
			scene.add(lane.mesh);
			return lane;
		})
		.filter((lane) => lane.index >= 0);

const addLane = () => {
	const index = lanes.length;
	const lane = new Lane(index);
	lane.mesh.position.y = index * positionWidth * zoom;
	scene.add(lane.mesh);
	lane.push(lane);
};

const laneTypes = ["car", "truck", "forest"];
const laneSpeeds = [2, 2.5, 3];
const vehicleSpeeds = [0xa52523, 0xbddb63, 0x78b14b];
const threeHeights = [20, 45, 60];

const init = () => {
	lanes = generateLanes();
	currentLane = 0;
	currentColumn = Math.floor(columns / 2);
	previousTimeStamp = null;
	startMoving = false;
	moves = [];
	stepStartTimestamp;
	chicken.position.x = 0;
	chicken.position.x = 0;
	camera.position.x = initialCameraPositionX;
	camera.position.y = initialCameraPositionY;
	dirLight.position.x = initialDirLightPositionX;
	dirLight.position.y = initialDirLightPositionY;
};

init();

class Texture {
	pretty() {
		console.log("I am a Texture");
	}
}

class Lane {
	distance() {
		console.log("The distance is short");
	}
}

class Chicken {
	cluck() {
		console.log("Cluck Cluck Cluck");
	}
}
