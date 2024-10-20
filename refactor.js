import * as THREE from "three";

const CONFIG = {
	distance: 500,
	zoom: 2,
	chickenSize: 15,
	positionWidth: 42,
	columns: 17,
	stepTime: 200,
	laneTypes: ["car", "truck", "forest"],
	laneSpeeds: [2, 2.5, 3],
	vehicleColors: [0xa52523, 0xbdb638, 0x78b14b],
	treeHeights: [20, 45, 60],
	initialCameraRotation: {
		x: (50 * Math.PI) / 180,
		y: (20 * Math.PI) / 180,
		z: (10 * Math.PI) / 180,
	},
	lightPosition: {
		initialDirLight: { x: -100, y: -100, z: 200 },
		backLight: { x: 200, y: 200, z: 50 },
	},
	shadowMapSize: 2048,
	boardWidth: 42 * 17,
};

const camera = createCamera();
const scene = new THREE.Scene();
const chicken = createChicken();
let lanes = generateLanes();

const hemiLight = createHemisphereLight();
const dirLight = createDirectionalLight(chicken);

scene.add(hemiLight, dirLight, chicken);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
setupRenderer(renderer);

initalizeGame();

document.querySelector("#retry").addEventListener("click", resetGame);

// Camera and Lighting Setup
function createCamera() {
	const { x, y, z } = CONFIG.initialCameraRotation;
	const camera = new THREE.OrthographicCamera(
		window.innerWidth / -2,
		window.innerWidth / 2,
		window.innerHeight / 2,
		window.innerHeight / -2,
		0.1,
		10000
	);
	camera.rotation.set(x, y, z);
	camera.position.set(
		getInitialCameraPositionX(),
		getInitialCameraPositionY(),
		CONFIG.distance
	);
	return camera;
}

function getInitialCameraPositionY() {
	return -Math.tan(camera.rotation.x) * CONFIG.distance;
}

function getInitialCameraPositionX() {
	return (
		Math.tan(camera.rotation.y) *
		Math.sqrt(CONFIG.distance ** 2 + getInitialCameraPositionY() ** 2)
	);
}

function createHemisphereLight() {
	return new THREE.HemisphereLight(0xffffff, 0xffff);
}

function createDirectionalLight(target) {
	const light = new THREE.DirectionalLight(0xffffff, 0.6);
	light.position.set(
		CONFIG.lightPosition.initialDirLight.x,
		CONFIG.lightPosition.initialDirLight.y,
		CONFIG.lightPosition.initialDirLight.z
	);
	light.castShadow = true;
	light.target = target;
	light.shadow.mapSize.width = CONFIG.shadowMapSize;
	light.shadow.mapSize.height = CONFIG.shadowMapSize;
	return light;
}

// Renderer Setup
function setupRenderer(renderer) {
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
}

// Game Initialization
function generateLanes() {
	return Array.from({ length: 10 }, (_, index) => {
		const lane = new Lane(index);
		lane.mesh.position.y = index * CONFIG.positionWidth * CONFIG.zoom;
		scene.add(lane.mesh);
		return lane;
	});
}

function initalizeGame() {
	lanes = generateLanes();
	// Additional initialization logic can be added here
}

// Game Entities
function createChicken() {
	const chicken = new THREE.Group();
	const body = new THREE.Mesh(
		new THREE.BoxGeometry(
			CONFIG.chickenSize * CONFIG.zoom,
			CONFIG.chickenSize * CONFIG.zoom,
			20 * CONFIG.zoom
		),
		new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true })
	);
	body.position.z = 10 * CONFIG.zoom;
	body.castShadow = true;
	body.receiveShadow = true;
	chicken.add(body);

	const rowel = new THREE.Mesh(
		new THREE.BoxGeometry(
			2 * CONFIG.zoom,
			4 * CONFIG.zoom,
			2 * CONFIG.zoom
		),
		new THREE.MeshLambertMaterial({ color: 0xf0619a, flatShading: true })
	);
	rowel.position.z = 21 * CONFIG.zoom;
	rowel.castShadow = true;
	rowel.receiveShadow = false;
	chicken.add(rowel);
	return chicken;
}

function resetGame() {
	lanes.forEach((lane) => scene.remove(lane.mesh));
	initalizeGame();
	document.getElementById("end").style.visibility = "hidden";
}

// Lane Class
function Lane(index) {
	this.index = index;
	this.type =
		index <= 0
			? "field"
			: CONFIG.laneTypes[
					Math.floor(Math.random() * CONFIG.laneTypes.length)
			  ];

	switch (this.type) {
		case "field": {
			this.mesh = new Grass();
			break;
		}
		case "forest": {
			this.mesh = new Grass();
			this.occupiedPositions = new Set();
			this.trees = createTrees();
			break;
		}
		case "car": {
			this.mesh = new Road();
			this.direction = Math.random() >= 0.5;
			this.vehicles = createVehicles(Car);
			this.speed = getRandomSpeed();
			break;
		}
		case "truck": {
			this.mesh = new Road();
			this.direction = Math.random() >= 0.5;
			this.vehicles = createVehicles(Truck);
			this.speed = getRandomSpeed();
			break;
		}
	}
}

function createVehicles(VehicleConstructor) {
	const occupiedPositions = new Set();
	return [1, 2, 3].map(() => {
		const vehicle = new VehicleConstructor();
		let position;
		do {
			position = Math.floor((Math.random() * CONFIG.columns) / 2);
		} while (occupiedPositions.has(position));
		occupiedPositions.add(position);
		vehicle.position.x =
			(position * CONFIG.positionWidth * 2 + CONFIG.positionWidth / 2) *
				CONFIG.zoom -
			(CONFIG.boardWidth * CONFIG.zoom) / 2;
		if (!this.direction) vehicle.rotation.z = Math.PI;
		this.mesh.add(vehicle);
		return vehicle;
	});
}

function getRandomSpeed() {
	return CONFIG.laneSpeeds[
		Math.floor(Math.random() * CONFIG.laneSpeeds.length)
	];
}

// Vehicle Functions
function Car() {
	return createVehicle(60, 30, CONFIG.vehicleColors, createCarTextures());
}

function Truck() {
	return createVehicle(100, 35, CONFIG.vehicleColors, createTruckTextures());
}

function createVehicle(length, width, colors, textures) {
	const vehicle = new THREE.Group();
	const color = colors[Math.floor(Math.random() * colors.length)];

	const base = new THREE.Mesh(
		new THREE.BoxGeometry(
			length * CONFIG.zoom,
			width * CONFIG.zoom,
			15 * CONFIG.zoom
		),
		new THREE.MeshPhongMaterial({ color, flatShading: true })
	);
	base.position.z = 12 * CONFIG.zoom;
	base.castShadow = true;
	base.receiveShadow = true;
	vehicle.add(base);

	const cabin = createVehicleCabin(textures);
	vehicle.add(cabin);

	const frontWheel = createWheel();
	const backWheel = createWheel();
	frontWheel.position.x = -18 * CONFIG.zoom;
	backWheel.position.x = 18 * CONFIG.zoom;
	vehicle.add(frontWheel, backWheel);

	return vehicle;
}

function createVehicleCabin(textures) {
	const cabin = new THREE.Mesh(
		new THREE.BoxGeometry(
			33 * CONFIG.zoom,
			24 * CONFIG.zoom,
			12 * CONFIG.zoom
		),
		textures
	);
	cabin.position.z = 25.5 * CONFIG.zoom;
	return cabin;
}

function createCarTextures() {
	return [
		new THREE.MeshPhongMaterial({
			map: new Texture(40, 80, [{ x: 0, y: 10, w: 30, h: 60 }]),
		}),
		new THREE.MeshPhongMaterial({
			map: new Texture(40, 80, [{ x: 10, y: 10, w: 30, h: 60 }]),
		}),
		new THREE.MeshPhongMaterial({
			map: new Texture(110, 40, [
				{ x: 10, y: 0, w: 50, h: 30 },
				{ x: 70, y: 0, w: 30, h: 30 },
			]),
		}),
		new THREE.MeshPhongMaterial({
			map: new Texture(110, 40, [
				{ x: 10, y: 10, w: 50, h: 30 },
				{ x: 70, y: 10, w: 30, h: 30 },
			]),
		}),
		new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true }),
		new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true }),
	];
}

function createTruckTextures() {
	return [
		new THREE.MeshPhongMaterial({
			map: new Texture(30, 30, [{ x: 15, y: 0, w: 10, h: 30 }]),
		}),
		new THREE.MeshPhongMaterial({
			map: new Texture(25, 30, [{ x: 0, y: 15, w: 10, h: 10 }]),
		}),
		new THREE.MeshPhongMaterial({
			map: new Texture(25, 30, [{ x: 0, y: 5, w: 10, h: 10 }]),
		}),
		new THREE.MeshPhongMaterial({ color: 0xb4c6fc, flatShading: true }),
	];
}

function createWheel() {
	return new THREE.Mesh(
		new THREE.BoxGeometry(
			12 * CONFIG.zoom,
			33 * CONFIG.zoom,
			12 * CONFIG.zoom
		),
		new THREE.MeshLambertMaterial({ color: 0x333333, flatShading: true })
	);
}

// Environment (Grass, Road, Trees)
function Grass() {
	const grass = new THREE.Group();
	grass.add(
		createSection(0xbaf455),
		createSideSection(0x99c846, -1),
		createSideSection(0x99c846, 1)
	);
	grass.position.z = 1.5 * CONFIG.zoom;
	return grass;
}

function Road() {
	const road = new THREE.Group();
	road.add(
		createSection(0x454a59),
		createSideSection(0x393d49, -1),
		createSideSection(0x393d49, 1)
	);
	return road;
}

function createSection(color) {
	return new THREE.Mesh(
		new THREE.PlaneGeometry(
			CONFIG.boardWidth * CONFIG.zoom,
			CONFIG.positionWidth * CONFIG.zoom
		),
		new THREE.MeshPhongMaterial({ color })
	);
}

function createSideSection(color, direction) {
	const section = createSection(color);
	section.position.x = direction * CONFIG.boardWidth * CONFIG.zoom;
	return section;
}

function createTrees() {
	return Array.from({ length: 4 }, () => {
		const tree = new Three();
		let position;
		do {
			position = Math.floor(Math.random() * CONFIG.columns);
		} while (this.occupiedPositions.has(position));
		this.occupiedPositions.add(position);
		tree.position.x =
			(position * CONFIG.positionWidth + CONFIG.positionWidth / 2) *
				CONFIG.zoom -
			(CONFIG.boardWidth * CONFIG.zoom) / 2;
		this.mesh.add(tree);
		return tree;
	});
}

function Three() {
	const tree = new THREE.Group();

	const trunk = new THREE.Mesh(
		new THREE.BoxGeometry(
			15 * CONFIG.zoom,
			15 * CONFIG.zoom,
			20 * CONFIG.zoom
		),
		new THREE.MeshPhongMaterial({ color: 0x4d2926, flatShading: true })
	);
	trunk.position.z = 10 * CONFIG.zoom;
	tree.add(trunk);

	const crown = new THREE.Mesh(
		new THREE.BoxGeometry(
			30 * CONFIG.zoom,
			30 * CONFIG.zoom,
			CONFIG.treeHeights[
				Math.floor(Math.random() * CONFIG.treeHeights.length)
			] * CONFIG.zoom
		),
		new THREE.MeshLambertMaterial({ color: 0x7aa21d, flatShading: true })
	);
	crown.position.z = (CONFIG.treeHeights[0] / 2 + 20) * CONFIG.zoom;
	tree.add(crown);

	return tree;
}

// Animation Loop
function animate(timestamp) {
	requestAnimationFrame(animate);
	const delta = timestamp - (previousTimestamp || timestamp);
	previousTimestamp = timestamp;

	lanes.forEach((lane) => updateLane(lane, delta));

	renderer.render(scene, camera);
}

function updateLane(lane, delta) {
	if (lane.type === "car" || lane.type === "truck") {
		lane.vehicles.forEach((vehicle) => updateVehicle(vehicle, lane, delta));
	}
}

function updateVehicle(vehicle, lane, delta) {
	const aBitBeforeTheBeginning =
		(-CONFIG.boardWidth * CONFIG.zoom) / 2 -
		CONFIG.positionWidth * 2 * CONFIG.zoom;
	const aBitAfterTheEnd =
		(CONFIG.boardWidth * CONFIG.zoom) / 2 +
		CONFIG.positionWidth * 2 * CONFIG.zoom;

	if (lane.direction) {
		vehicle.position.x =
			vehicle.position.x < aBitBeforeTheBeginning
				? aBitAfterTheEnd
				: vehicle.position.x - (lane.speed / 16) * delta;
	} else {
		vehicle.position.x =
			vehicle.position.x > aBitAfterTheEnd
				? aBitBeforeTheBeginning
				: vehicle.position.x + (lane.speed / 16) * delta;
	}
}

requestAnimationFrame(animate);
