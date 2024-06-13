import * as $3Dmol from '3dmol';
import $ from 'jquery';

let selectedHelices = [];  // Array to store selected helices
let helixCount = 0;  // Counter to keep track of added helices
let currentViewMode = 'cartoon';  // Variable to store the current view mode

// Initialize the viewer
const viewer = $3Dmol.createViewer("canvas-container", {
    backgroundColor: "black",
});

// PDB file URL
const pdbUrl = 'https://bioshell.pl/~dgront/alpha_bundle_with_pyrosetta/manual_make_bundle.pdb';

// Load PDB file and display structure
$.get(pdbUrl, function(data) {
    const model = viewer.addModel(data, 'pdb');  // Add model
    setViewMode(model, currentViewMode);  // Set initial display mode
    viewer.zoomTo();  // Zoom to model
    viewer.render();  // Render

    // Enable clickability to select atoms
    viewer.setClickable({}, true, (atom, viewer, event, container) => {
        const residue = atom.resi;  // Get residue number of the atom
        const ss = atom.ss;  // Get secondary structure type (alpha-helix or beta-sheet)

        if (ss === 'h') {  // If the atom is part of an alpha-helix
            if (selectedHelices.includes(residue)) {
                const index = selectedHelices.indexOf(residue);
                selectedHelices.splice(index, 1);
                setViewMode(model, currentViewMode);
            } else {
                selectedHelices.push(residue);
                viewer.setStyle({resi: residue}, {[currentViewMode]: {color: 'green'}});
            }
            viewer.render();
        }
    });
});

// Function to set the view mode
function setViewMode(model, mode) {
    switch (mode) {
        case 'cartoon':
            model.setStyle({}, {cartoon: {color: 'spectrum'}});
            break;
        case 'line':
            model.setStyle({}, {line: {}});
            break;
        case 'stick':
            model.setStyle({}, {stick: {}});
            break;
    }
    viewer.render();
}

// Add a new alpha helix
document.getElementById('addCylinder').addEventListener('click', () => {
    const length = 10;  // Length of the new helix
    const atoms = [];
    for (let i = 0; i < length; i++) {
        atoms.push({elem: 'C', x: i * 1.5, y: helixCount * 5, z: 0, resi: helixCount + 1, ss: 'h'});
    }
    const model = viewer.addModel();
    model.addAtoms(atoms);
    setViewMode(model, currentViewMode);
    viewer.zoomTo();
    viewer.render();
    helixCount++;
});

// Remove the selected element
document.getElementById('removeElement').addEventListener('click', () => {
    if (selectedHelices.length > 0) {
        const model = viewer.getModel();
        selectedHelices.forEach(residue => {
            model.removeAtoms({resi: residue});
        });
        setViewMode(model, currentViewMode);
        viewer.render();
        selectedHelices = [];
    } else {
        alert('Select an element to remove.');
    }
});

// Open color selection dialog
document.getElementById('changeColor').addEventListener('click', () => {
    if (selectedHelices.length > 0) {
        const colorOptions = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'cyan', 'magenta', 'pink', 'gray'];
        const colorChoice = prompt('Choose a color: ' + colorOptions.join(', '));
        if (colorOptions.includes(colorChoice)) {
            const model = viewer.getModel();
            selectedHelices.forEach(residue => {
                viewer.setStyle({resi: residue}, {[currentViewMode]: {color: colorChoice}});
            });
            viewer.render();
            selectedHelices = [];  // Reset selected helices
        } else {
            alert('Invalid color choice.');
        }
    } else {
        alert('Select an element to change its color.');
    }
});

// Transform the selected element
document.getElementById('transformElement').addEventListener('click', () => {
    if (selectedHelices.length > 0) {
        const model = viewer.getModel();
        selectedHelices.forEach(residue => {
            const atoms = model.selectedAtoms({resi: residue});
            atoms.forEach(atom => {
                atom.x += 1;  // Change coordinates for transformation
                atom.y += 1;
                atom.z += 1;
            });
        });
        model.updateStyle();
        viewer.render();
    } else {
        alert('Select an element to transform.');
    }
});

// Save the scene
document.getElementById('saveScene').addEventListener('click', () => {
    const sceneJson = viewer.getModel().toJSON();
    const jsonData = JSON.stringify(sceneJson, null, 2);

    const blob = new Blob([jsonData], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scene.json';
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('modal').style.display = 'none';
});

document.getElementById('closeJsonModal').addEventListener('click', () => {
    document.getElementById('json-modal').style.display = 'none';
});

document.getElementById('modalSubmit').addEventListener('click', () => {
    const length = document.getElementById('length').value;
    console.log('Length submitted:', length);
    document.getElementById('modal').style.display = 'none';
});

// Change view to cartoon
document.getElementById('changeViewToCartoon').addEventListener('click', () => {
    currentViewMode = 'cartoon';
    const model = viewer.getModel();
    if (model) {
        setViewMode(model, currentViewMode);
    }
});

// Change view to line
document.getElementById('changeViewToLine').addEventListener('click', () => {
    currentViewMode = 'line';
    const model = viewer.getModel();
    if (model) {
        setViewMode(model, currentViewMode);
    }
});

// Change view to stick
document.getElementById('changeViewToStick').addEventListener('click', () => {
    currentViewMode = 'stick';
    const model = viewer.getModel();
    if (model) {
        setViewMode(model, currentViewMode);
    }
});

// Rotate atoms function
function rotateAtoms(atoms, axis, angle) {
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    atoms.forEach(atom => {
        const {x, y, z} = atom;
        let newX, newY, newZ;

        switch (axis) {
            case 'x':
                newY = y * cosAngle - z * sinAngle;
                newZ = y * sinAngle + z * cosAngle;
                atom.y = newY;
                atom.z = newZ;
                break;
            case 'y':
                newX = x * cosAngle + z * sinAngle;
                newZ = -x * sinAngle + z * cosAngle;
                atom.x = newX;
                atom.z = newZ;
                break;
            case 'z':
                newX = x * cosAngle - y * sinAngle;
                newY = x * sinAngle + y * cosAngle;
                atom.x = newX;
                atom.y = newY;
                break;
        }
    });
}

// Rotate the selected helix
document.addEventListener('keydown', (event) => {
    const angle = Math.PI / 36;  // Rotation angle in radians (5 degrees)
    if (selectedHelices.length > 0) {
        const model = viewer.getModel();
        const residue = selectedHelices[0];
        const atoms = model.selectedAtoms({resi: residue});

        switch (event.key) {
            case 'ArrowUp':
                rotateAtoms(atoms, 'x', -angle);
                break;
            case 'ArrowDown':
                rotateAtoms(atoms, 'x', angle);
                break;
            case 'ArrowLeft':
                rotateAtoms(atoms, 'y', -angle);
                break;
            case 'ArrowRight':
                rotateAtoms(atoms, 'y', angle);
                break;
        }

        viewer.render();
    }
});

// Add beta sheet by connecting selected helices
document.getElementById('addBetaSheet').addEventListener('click', () => {
    if (selectedHelices.length === 2) {
        const model = viewer.getModel();
        const resi1 = selectedHelices[0];
        const resi2 = selectedHelices[1];

        const atoms1 = model.selectedAtoms({resi: resi1});
        const atoms2 = model.selectedAtoms({resi: resi2});

        const length = Math.min(atoms1.length, atoms2.length);
        const betaSheetAtoms = [];
        for (let i = 0; i < length; i++) {
            betaSheetAtoms.push({
                elem: 'C',
                x: (atoms1[i].x + atoms2[i].x) / 2,
                y: (atoms1[i].y + atoms2[i].y) / 2,
                z: (atoms1[i].z + atoms2[i].z) / 2,
                resi: helixCount + 1,
                ss: 's'
            });
        }

        model.addAtoms(betaSheetAtoms);
        setViewMode(model, currentViewMode);
        viewer.render();
        helixCount++;
    } else {
        alert('Select two helices to connect with a beta sheet.');
    }
});
