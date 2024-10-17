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

const renderer = new THREE.WebGLRenderer({
	alpha: true,
	antialias: true,
});

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setSize(window, innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

function Texture(width, height, rects) {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext("2d");
	context.fillStyle = "#fff";
	context.fillRect(0, 0, width, height);
	context.fillStyle = "rgba(0,0,0,0.6)";
	rects.forEach((rect) => {
		context.fillRect(rect.x, rect.y, rect.w, rect.h);
	});
	return THREE.CanvasTexture(canvas);
}

function Wheel() {
	const wheel = new THREE.Mesh(
		new THREE.BoxGeometry(12 * zoom, 33 * zoom, 12 * zoom),
		new THREE.MeshLambertMaterial({ color: 0x333, flatShading: true })
	);
	wheel.position.z = 6 * zoom;
	return wheel;
}

function Car() {
	const car = new THREE.Group();
	const color =
		vehicleColors[Math.floor(Math.random() * vehicleColors.length)];
	const main = new THREE.Mesh(
		new THREE.BoxGeometry(60 * zoom, 30 * zoom, 15 * zoom),
		new THREE.MeshPhongMaterial({ color, flatShading: true })
	);
	main.position.z = 12 * zoom;
	main.castShadow = true;
	main.receiveShadow = true;
	car.add(main);

	const cabin = new THREE.Mesh(
		new THREE.BoxGeometry(33 * zoom, 24 * zoom, 12 * zoom),
		[
			new THREE.MeshPhongMaterial({
				color: 0xccc,
				flatShading: true,
				map: carBackTexture,
			}),
			new THREE.MeshPhongMaterial({
				color: 0xccc,
				flatShading: true,
				map: carFrontTexture,
			}),
			new THREE.MeshPhongMaterial({
				color: 0xccc,
				flatShading: true,
				map: carRightSideTexture,
			}),
			new THREE.MeshPhongMaterial({
				color: 0xccc,
				flatShading: true,
				map: carLeftSideTexture,
			}),
			new THREE.MeshPhongMaterial({ color: 0xccc, flatShading: true }),
			new THREE.MeshPhongMaterial({ color: 0xccc, flatShading: true }),
		]
	);

	cabin.position.x = 6 * zoom;
	cabin.position.z = 25.5 * zoom;
	cabin.castShadow = true;
	cabin.receiveShadow = true;
	car.add(cabin);

	const frontWheel = new Wheel();
	frontWheel.position.x = -18 * zoom;
	car.add(frontWheel);

	const backWheel = new Wheel();
	backWheel.position.x = 18 * zoom;
	car.add(backWheel);

	car.castShadow = true;
	car.receiveShadow = false;

	return car;
}

function Truck() {
	const truck = new THREE.Group();
	const color =
		vehicleColors[Math.floor(Math.random() * vehicleColors.length)];

	const base = new THREE.Mesh(
		new THREE.BoxGeometry(100 * zoom, 25 * zoom, 5 * zoom),
		new THREE.MeshLambertMaterial({ color: 0xb4c6fc, flatShading: true })
	);

	base.position.z = 10 * zoom;
	truck.add(base);

	const cargo = new THREE.Mesh(
		new THREE.BoxGeometry(75 * zoom, 35 * zoom, 40 * zoom),
		new THREE.MeshLambertMaterial({ color: 0xb4c6fc, flatShading: true })
	);

	cargo.position.x = 15 * zoom;
	cargo.position.z = 30 * zoom;
	cargo.castShadow = true;
	cargo.receiveShadow = true;
	truck.add(cargo);

	const cabin = new THREE.Mesh(
		new THREE.BoxGeometry(100 * zoom, 25 * zoom, 5 * zoom),
		[
			new THREE.MeshPhongMaterial({ color, flatShading: true }),
			new THREE.MeshPhongMaterial({
				color,
				flatShading: true,
				map: truckFrontTexture,
			}),
			new THREE.MeshPhongMaterial({
				color,
				flatShading: true,
				map: truckRightSideTexture,
			}),
			new THREE.MeshPhongMaterial({
				color,
				flatShading: true,
				map: truckLeftSideTexture,
			}),
			new THREE.MeshPhongMaterial({ color, flatShading: true }),
			new THREE.MeshPhongMaterial({ color, flatShading: true }),
		]
	);

	cabin.position.x = -40 * zoom;
	cabin.position.z = 20 * zoom;
	cabin.castShadow = true;
	cabin.receiveShadow = true;
	truck.add(cabin);

	const frontWheel = new Wheel();
	frontWheel.position.x = -38 * zoom;
	truck.add(frontWheel);

	const middleWheel = new Wheel();
	middleWheel.position.x = -10 * zoom;
	truck.add(middleWheel);

	const backWheel = new Wheel();
	backWheel.position.x = 30 * zoom;
	truck.add(backWheel);

	return truck;
}

function Three() {
	const three = new THREE.Group();
	const truck = new THREE.Mesh(
		new THREE.BoxGeometry(15 * zoom, 15 * zoom, 20 * zoom),
		new THREE.MeshPhongMaterial({ color: 0x4d2926, flatShading: true })
	);
	truck.position.z = 10 * zoom;
	truck.castShadow = true;
	truck.receiveShadow = true;
	three.add(truck);

	let height = threeHeights[Math.floor(Math.random() * threeHeights.length)];

	const crown = new THREE.Mesh(
		new THREE.BoxGeometry(30 * zoom, 30 * zoom, height * zoom),
		new THREE.MeshLambertMaterial({ color: 0x7aa21d, flatShading: true })
	);
	crown.position.z = (height / 2 + 20) * zoom;
	crown.castShadow = true;
	crown.receiveShadow = false;
	three.add(crown);

	return crown;
}

function Lane(index) {}

function Grass() {
	const grass = new THREE.Group();

	const createSection = (color) =>
		new THREE.Mesh(
			new THREE.BoxGeometry(
				boardWidth * zoom,
				positionWidth * zoom,
				3 * zoom
			),
			new THREE.MeshPhongMaterial({ color })
		);

	const middle = createSection(0xbaf455);
	middle.receiveShadow = true;
	grass.add(middle);

	const left = createSection(0x99c846);
	left.receiveShadow = true;
	grass.add(left);

	const right = createSection(0x99c846);
	right.receiveShadow = true;
	grass.add(right);

	grass.position.z = 1.5 * zoom;
	return grass;
}

function Road() {
	const road = new THREE.Group();
	const createSection = (color) =>
		new THREE.Mesh(
			new THREE.PlaneGeometry(boardWidth * zoom, positionWidth * zoom),
			new THREE.MeshPhongMaterial({ color })
		);

	const middle = createSection(0x454a59);
	middle.receiveShadow = true;
	road.add(middle);

	const left = createSection(0x393d49);
	left.position.x = -boardWidth * zoom;
	road.add(left);

	const right = createSection(0x393d49);
	right.position.x = boardWidth * zoom;
	road.add(right);

	return road;
}

function Chicken() {
	const chicken = new THREE.Group();
	const body = new THREE.Mesh(
		new THREE.BoxGeometry(chickenSize * zoom, chicken * zoom, 20 * zoom),
		new THREE.MeshPhongMaterial({ color: 0xfff, flatShading: true })
	);
	body.position.z = 10 * zoom;
	body.castShadow = true;
	body.receiveShadow = true;
	chicken.add(body);

	const rowel = new THREE.Mesh(
		new THREE.BoxGeometry(2 * zoom, 4 * zoom, 2 * zoom),
		new THREE.MeshLambertMaterial({ color: 0xf0619a, flatShading: true })
	);
	rowel.position.z = 21 * zoom;
	rowel.castShadow = true;
	rowel.receiveShadow = false;
	chicken.add(rowel);

	return chicken;
}
