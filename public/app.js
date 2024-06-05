import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DragControls } from 'three/examples/jsm/controls/DragControls';

// Initialize Three.js scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Add lighting
const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
scene.add(ambientLight);

const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight1.position.set(1, 1, 1).normalize();
scene.add(directionalLight1);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight2.position.set(-1, 1, -1).normalize();
scene.add(directionalLight2);

// Variables for elements and controls
let elements = [];
let connections = [];
let selectedElements = [];
let dragControls;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Function to add an alpha helix (cylinder)
function addCylinder(length = 5) {
    const geometry = new THREE.CylinderGeometry(1, 1, length, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const cylinder = new THREE.Mesh(geometry, material);
    cylinder.userData.type = 'alpha-helix';
    cylinder.position.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5);
    scene.add(cylinder);
    elements.push(cylinder);
    updateDragControls();
    updateProteinInfo();
}

// Function to add a beta sheet
function addBetaSheet(length = 5, width = 2) {
    const geometry = new THREE.BoxGeometry(length, width, 0.5);
    const material = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    const betaSheet = new THREE.Mesh(geometry, material);
    betaSheet.userData.type = 'beta-sheet';
    betaSheet.position.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5);
    scene.add(betaSheet);
    elements.push(betaSheet);
    updateDragControls();
    updateProteinInfo();
}

// Function to remove selected elements
function removeElement() {
    selectedElements.forEach(element => {
        scene.remove(element);
        elements = elements.filter(e => e !== element);
    });
    selectedElements = [];
    updateDragControls();
    updateProteinInfo();
}

// Function to rotate selected elements
function rotateElement() {
    selectedElements.forEach(element => {
        element.rotation.z += Math.PI / 4;  // Rotate by 45 degrees
    });
}

// Function to change color of selected elements
function changeColor() {
    selectedElements.forEach(element => {
        element.material.color.set(Math.random() * 0xffffff);
    });
}

// Function to transform selected elements (e.g., scale)
function transformElement() {
    selectedElements.forEach(element => {
        const scale = 1 + Math.random(); // Example: scale by 1-2 times
        element.scale.set(scale, scale, scale);
    });
}

// Function to add a connection (curve) between two elements
function addConnection() {
    if (selectedElements.length !== 2) {
        alert('Please select exactly two elements to connect.');
        return;
    }
    const startPoint = selectedElements[0].position;
    const endPoint = selectedElements[1].position;
    const curve = new THREE.CatmullRomCurve3([
        startPoint,
        new THREE.Vector3(
            (startPoint.x + endPoint.x) / 2,
            (startPoint.y + endPoint.y) / 2 + 5,
            (startPoint.z + endPoint.z) / 2
        ),
        endPoint
    ]);

    const geometry = new THREE.TubeGeometry(curve, 20, 0.2, 8, false);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff }); // Lighter color
    const tube = new THREE.Mesh(geometry, material);
    scene.add(tube);
    connections.push(tube);
}

// Function to update drag controls
function updateDragControls() {
    if (dragControls) {
        dragControls.dispose();
    }
    dragControls = new DragControls(elements, camera, renderer.domElement);
    dragControls.addEventListener('dragstart', function (event) {
        controls.enabled = false;
        selectedElements = [event.object];
    });
    dragControls.addEventListener('dragend', function (event) {
        controls.enabled = true;
        selectedElements = [event.object];
    });
}

// Function to save the scene as JSON
function saveScene() {
    const sceneData = elements.map(element => ({
        type: element.userData.type,
        position: element.position,
        rotation: element.rotation,
        scale: element.scale,
        color: element.material.color
    }));
    fetch('/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(sceneData),
    }).then(response => response.text())
        .then(data => alert(data))
        .catch(error => console.error('Error:', error));
}

// Function to update protein information
function updateProteinInfo() {
    const proteinInfo = document.getElementById('protein-info');
    const alphaHelices = elements.filter(e => e.userData.type === 'alpha-helix').length;
    const betaSheets = elements.filter(e => e.userData.type === 'beta-sheet').length;
    proteinInfo.innerHTML = `Alpha helices: ${alphaHelices}, Beta sheets: ${betaSheets}`;
}

// Event handlers for buttons
document.getElementById('addCylinder').addEventListener('click', () => {
    openModal('cylinder');
});
document.getElementById('addBetaSheet').addEventListener('click', () => {
    openModal('betaSheet');
});
document.getElementById('removeElement').addEventListener('click', () => removeElement());
document.getElementById('rotateElement').addEventListener('click', () => rotateElement());
document.getElementById('changeColor').addEventListener('click', () => changeColor());
document.getElementById('transformElement').addEventListener('click', () => transformElement());
document.getElementById('addConnection').addEventListener('click', () => addConnection());
document.getElementById('saveScene').addEventListener('click', () => saveScene());

// Modal logic
const modal = document.getElementById('modal');
const closeModal = document.getElementById('closeModal');
const modalSubmit = document.getElementById('modalSubmit');
let currentElementType = '';

function openModal(elementType) {
    currentElementType = elementType;
    modal.style.display = 'block';
}

closeModal.onclick = function() {
    modal.style.display = 'none';
}

modalSubmit.onclick = function() {
    const length = parseFloat(document.getElementById('length').value);
    if (currentElementType === 'cylinder') {
        addCylinder(length);
    } else if (currentElementType === 'betaSheet') {
        addBetaSheet(length);
    }
    modal.style.display = 'none';
}

// Double click to select element
function onDoubleClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(elements);
    if (intersects.length > 0) {
        selectedElements = [intersects[0].object];
    }
}

window.addEventListener('dblclick', onDoubleClick, false);

// Initialize OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.z = 20;
controls.update();

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();
