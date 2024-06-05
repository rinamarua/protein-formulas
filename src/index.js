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
let lastSelectedElement = null;

// Function to add an alpha helix (cylinder)
function addCylinder(length = 5) {
    const geometry = new THREE.CylinderGeometry(1, 1, length, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const cylinder = new THREE.Mesh(geometry, material);
    cylinder.userData = {
        type: 'alpha-helix',
        color: cylinder.material.color.clone()
    };
    cylinder.position.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5);
    scene.add(cylinder);
    elements.push(cylinder);

    // Add connection to last selected element
    if (lastSelectedElement) {
        addConnection(lastSelectedElement, cylinder);
    }

    updateDragControls();
    updateProteinInfo();
}

// Function to add a beta sheet (curve)
function addBetaSheet() {
    if (selectedElements.length !== 2) {
        alert("Please select exactly two alpha helices to add a beta sheet.");
        return;
    }

    const element1 = selectedElements[0];
    const element2 = selectedElements[1];

    const curve = new THREE.CatmullRomCurve3([
        element1.position.clone().add(new THREE.Vector3(0, element1.geometry.parameters.height / 2, 0).applyQuaternion(element1.quaternion)),
        new THREE.Vector3(
            (element1.position.x + element2.position.x) / 2,
            (element1.position.y + element2.position.y) / 2 + Math.random() * 5,
            (element1.position.z + element2.position.z) / 2
        ),
        element2.position.clone().add(new THREE.Vector3(0, -element2.geometry.parameters.height / 2, 0).applyQuaternion(element2.quaternion))
    ]);

    const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.2, 8, false);
    const tubeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);

    tube.userData = { elements: [element1, element2] };
    scene.add(tube);
    connections.push({ line: tube, elements: [element1, element2] });

    selectedElements = [];
    highlightSelectedElements();
}

// Function to remove selected elements
function removeElement() {
    selectedElements.forEach(element => {
        // Remove connections involving this element
        connections = connections.filter(connection => {
            if (connection.elements.includes(element)) {
                scene.remove(connection.line);
                return false;
            }
            return true;
        });

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
        updateConnections();
    });
}

// Function to change color of selected elements
function changeColor() {
    selectedElements.forEach(element => {
        const newColor = new THREE.Color(Math.random() * 0xffffff);
        element.material.color.set(newColor);
        element.userData.color = newColor; // Update stored color
    });
}

// Function to transform selected elements (e.g., scale)
function transformElement() {
    selectedElements.forEach(element => {
        const scale = 1 + Math.random(); // Example: scale by 1-2 times
        element.scale.set(scale, scale, scale);
        updateConnections();
    });
}

// Function to add a connection between two elements
function addConnection(element1, element2) {
    const curve = new THREE.CatmullRomCurve3([
        element1.position.clone().add(new THREE.Vector3(0, element1.geometry.parameters.height / 2, 0).applyQuaternion(element1.quaternion)),
        new THREE.Vector3(
            (element1.position.x + element2.position.x) / 2,
            (element1.position.y + element2.position.y) / 2 + Math.random() * 5,
            (element1.position.z + element2.position.z) / 2
        ),
        element2.position.clone().add(new THREE.Vector3(0, -element2.geometry.parameters.height / 2, 0).applyQuaternion(element2.quaternion))
    ]);

    const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.2, 8, false);
    const tubeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);

    tube.userData = { elements: [element1, element2] };
    scene.add(tube);
    connections.push({ line: tube, elements: [element1, element2] });
}

// Function to update positions of connections
function updateConnections() {
    connections.forEach(connection => {
        const { line, elements } = connection;
        const element1 = elements[0];
        const element2 = elements[1];
        const curve = new THREE.CatmullRomCurve3([
            element1.position.clone().add(new THREE.Vector3(0, element1.geometry.parameters.height / 2, 0).applyQuaternion(element1.quaternion)),
            new THREE.Vector3(
                (element1.position.x + element2.position.x) / 2,
                (element1.position.y + element2.position.y) / 2 + Math.random() * 5,
                (element1.position.z + element2.position.z) / 2
            ),
            element2.position.clone().add(new THREE.Vector3(0, -element2.geometry.parameters.height / 2, 0).applyQuaternion(element2.quaternion))
        ]);

        const points = curve.getPoints(50);
        line.geometry = new THREE.TubeGeometry(curve, 64, 0.2, 8, false);
        line.geometry.attributes.position.needsUpdate = true;
    });
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
        highlightSelectedElements();
    });
    dragControls.addEventListener('dragend', function (event) {
        controls.enabled = true;
        selectedElements = [event.object];
        lastSelectedElement = event.object; // Update last selected element
        highlightSelectedElements();
    });
    dragControls.addEventListener('drag', updateConnections);
}

// Function to save the scene as JSON and display it in a modal
function saveScene() {
    const sceneData = elements.map(element => ({
        type: element.userData.type,
        position: element.position,
        rotation: element.rotation,
        scale: element.scale,
        color: element.userData.color // Use stored color
    }));

    const sceneJson = JSON.stringify(sceneData, null, 2); // Pretty print JSON

    // Display the JSON in the modal
    const jsonModal = document.getElementById('json-modal');
    const sceneJsonElement = document.getElementById('sceneJson');
    sceneJsonElement.textContent = sceneJson;
    jsonModal.style.display = 'block';
}

// Close modal when the user clicks on <span> (x)
document.getElementById('closeJsonModal').onclick = function() {
    document.getElementById('json-modal').style.display = 'none';
}

// Close modal when the user clicks anywhere outside of the modal
window.onclick = function(event) {
    if (event.target == document.getElementById('json-modal')) {
        document.getElementById('json-modal').style.display = 'none';
    }
}

// Function to update protein information
function updateProteinInfo() {
    const proteinInfo = document.getElementById('protein-info');
    const alphaHelices = elements.filter(e => e.userData.type === 'alpha-helix').length;
    const betaSheets = connections.length;
    proteinInfo.innerHTML = `Alpha helices: ${alphaHelices}, Beta sheets: ${betaSheets}`;
}

// Event handlers for buttons
document.getElementById('addCylinder').addEventListener('click', () => {
    openModal('cylinder');
});
document.getElementById('addBetaSheet').addEventListener('click', () => {
    addBetaSheet();
});
document.getElementById('removeElement').addEventListener('click', () => removeElement());
document.getElementById('rotateElement').addEventListener('click', () => rotateElement());
document.getElementById('changeColor').addEventListener('click', () => changeColor());
document.getElementById('transformElement').addEventListener('click', () => transformElement());
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
    }
    modal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Highlight selected elements
function highlightSelectedElements() {
    elements.forEach(element => {
        if (selectedElements.includes(element)) {
            element.material.color.set(0xff0000); // Set color to red for selected elements
        } else {
            element.material.color.copy(element.userData.color); // Reset color from userData
        }
    });
}

// Double click to select element
function onDoubleClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(elements);
    if (intersects.length > 0) {
        const clickedElement = intersects[0].object;
        const index = selectedElements.indexOf(clickedElement);

        // Toggle selection
        if (index > -1) {
            selectedElements.splice(index, 1);
        } else {
            selectedElements.push(clickedElement);
        }

        highlightSelectedElements();
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
