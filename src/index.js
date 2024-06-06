// Init libs
import * as $3Dmol from '3dmol';
import $ from 'jquery';

let selectedAtoms = [];

// Init viewer
const viewer = $3Dmol.createViewer("canvas-container", {
    backgroundColor: "black",
});

// URL PDB file
const pdbUrl = 'https://bioshell.pl/~dgront/alpha_bundle_with_pyrosetta/manual_make_bundle.pdb';

// Download PDB file & render structure
$.get(pdbUrl, function(data) {
    const model = viewer.addModel(data, 'pdb');
    model.setStyle({}, {cartoon: {color: 'spectrum'}});
    viewer.zoomTo();
    viewer.render();

    // Turn on clickable for select atoms
    viewer.setClickable({}, true, (atom, viewer, event, container) => {
        if (selectedAtoms.includes(atom)) {
            const index = selectedAtoms.indexOf(atom);
            selectedAtoms.splice(index, 1);
            viewer.setStyle({serial: atom.serial}, {cartoon: {color: 'spectrum'}});
        } else {
            selectedAtoms.push(atom);
            viewer.setStyle({serial: atom.serial}, {stick: {color: 'green'}});
        }
        viewer.render();
    });
});

// example for testing all functions
document.getElementById('addCylinder').addEventListener('click', () => {
    console.log('Add Alpha Helix clicked');
    const atoms = [
        {elem: 'C', x: 0, y: 0, z: 0},
        {elem: 'C', x: 1, y: 1, z: 1},
        {elem: 'C', x: 2, y: 2, z: 2},
        {elem: 'C', x: 3, y: 3, z: 3},
        {elem: 'C', x: 4, y: 4, z: 4}
    ];
    const model = viewer.addModel();
    model.addAtoms(atoms);
    model.setStyle({}, {stick: {}});
    viewer.zoomTo();
    viewer.render();
});

document.getElementById('removeElement').addEventListener('click', () => {
    console.log('Remove Element clicked');
    if (selectedAtoms.length > 0) {
        const model = viewer.getModel();
        selectedAtoms.forEach(atom => {
            viewer.setStyle({serial: atom.serial}, {hidden: true});
        });
        viewer.render();
        selectedAtoms = [];
    } else {
        alert('Select element for delete.');
    }
});

document.getElementById('rotateElement').addEventListener('click', () => {
    console.log('Rotate Element clicked');
    viewer.spin('y');
});

document.getElementById('changeColor').addEventListener('click', () => {
    console.log('Change Color clicked');
    if (selectedAtoms.length > 0) {
        selectedAtoms.forEach(atom => {
            atom.color = $3Dmol.CC.red;  // change color selected atoms
        });
        viewer.setStyle({serial: selectedAtoms.map(atom => atom.serial)}, {stick: {color: 'red'}});
        viewer.render();
        selectedAtoms = [];  // reset selected atoms
    } else {
        alert('Select element for change color.');
    }
});

document.getElementById('transformElement').addEventListener('click', () => {
    console.log('Transform Element clicked');
    if (selectedAtoms.length > 0) {
        selectedAtoms.forEach(atom => {
            atom.x += 1;  // Change x y z for transform
            atom.y += 1;
            atom.z += 1;
        });
        viewer.render();
    } else {
        alert('Select element for transform.');
    }
});

document.getElementById('saveScene').addEventListener('click', () => {
    console.log('Save Scene clicked');
    const sceneJson = viewer.getModel().toJSON();
    document.getElementById('sceneJson').textContent = JSON.stringify(sceneJson, null, 2);
    document.getElementById('json-modal').style.display = 'block';
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
    // ...
    document.getElementById('modal').style.display = 'none';
});

// Functions for change view Alpha Helix
document.getElementById('addBetaSheet').addEventListener('click', () => {
    console.log('Add Beta Sheet clicked');
    const model = viewer.getModel();
    if (model) {
        model.setStyle({}, {stick: {}});
        viewer.render();
    }
});

document.getElementById('changeViewToCartoon').addEventListener('click', () => {
    console.log('Change View to Cartoon clicked');
    const model = viewer.getModel();
    if (model) {
        model.setStyle({}, {cartoon: {color: 'spectrum'}});
        viewer.render();
    }
});

document.getElementById('changeViewToLine').addEventListener('click', () => {
    console.log('Change View to Line clicked');
    const model = viewer.getModel();
    if (model) {
        model.setStyle({}, {line: {}});
        viewer.render();
    }
});