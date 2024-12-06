// Scene, Camera, and Renderer setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, (window.innerWidth - 400) / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth - 400, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;
camera.position.set(0, 5, 15);
camera.lookAt(0, 0, 0);

// Lighting setup
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(1, 10, 1);
directionalLight.castShadow = true;
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// 3D Background (a distant sphere)
const backgroundGeometry = new THREE.SphereGeometry(500, 32, 32); // Large sphere
const backgroundMaterial = new THREE.MeshBasicMaterial({
    color: 0x87CEEB, // Light blue color
    side: THREE.BackSide // Only show the inside of the sphere
});
const background = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
scene.add(background);

// GLTF loader setup
const loader = new THREE.GLTFLoader();
let desktopModel;
let pieces = [];
let currentPieceIndex = 0;

// Load the selected model
loader.load(
    './desktop_pc/globe.glb', // Adjust to your model path
    (gltf) => {
        desktopModel = gltf.scene;
        
        desktopModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                pieces.push(child);
                child.visible = false; // Hide all parts initially
            }
        });

        desktopModel.scale.set(5, 5, 5); // Reduce the model size
        scene.add(desktopModel);

        // Adjust camera to fit the loaded model
        adjustCameraToFitModel();
    },
    undefined,
    (error) => {
        console.error('An error occurred while loading the GLTF model:', error);
    }
);

// Ocean Pollution Quiz in French
const quizData = [
    { question: "Quelle est la principale source de pollution plastique dans l'océan ?", answer: "1" }, // Plastiques provenant des activités terrestres
    { question: "Quel océan est le plus touché par la pollution ?", answer: "1" }, // L'océan Pacifique
    { question: "Quel pourcentage de la vie marine est menacé par la pollution plastique ?", answer: "1" }, // 80%
    { question: "Quel est le nom du patch de déchets plastiques flottants dans l'océan Pacifique ?", answer: "1" },
    { question: "Combien d'espèces marines sont affectées chaque année par les déchets plastiques ?", answer: "1" },
    { question: "Lequel des éléments suivants n'est PAS un contributeur majeur à la pollution de l'océan ?", answer: "1" }, // Le vent
    { question: "Qu'est-ce que la pollution par les microplastiques ?", answer: "1" }, // Petites particules de plastique
    { question: "Quel est le plastique le plus couramment trouvé dans l'océan ?", answer: "1" }
];
let currentQuestionIndex = 0;

const questionEl = document.getElementById("question");
const feedbackEl = document.getElementById("feedback");
const inputEl = document.getElementById("answerInput");
const buttonEl = document.getElementById("submitButton");

function loadNextQuestion() {
    if (currentQuestionIndex < quizData.length) {
        questionEl.textContent = quizData[currentQuestionIndex].question;
        inputEl.value = "";
        feedbackEl.textContent = "";
        feedbackEl.style.color = "green";
    } else {
        feedbackEl.textContent = "Quiz terminé ! Bien joué !";
        buttonEl.disabled = true;
        startRotation(); // Start the rotation after quiz completion
    }
}

buttonEl.addEventListener("click", () => {
    const userAnswer = inputEl.value.trim().toLowerCase();
    const correctAnswer = quizData[currentQuestionIndex].answer;

    if (userAnswer === correctAnswer) {
        feedbackEl.textContent = "Correct !";
        showNextPiece();
        currentQuestionIndex++;
        loadNextQuestion();
    } else {
        feedbackEl.style.color = "red";
        feedbackEl.textContent = "Mauvaise réponse. Essayez encore !";
    }
});

function showNextPiece() {
    if (currentPieceIndex < pieces.length) {
        pieces[currentPieceIndex].visible = true;
        currentPieceIndex++;
    }
}

// Function to start rotation of the entire object around its anchor point
function startRotation() {
    const duration = 2000; // Duration for rotation
    const startTime = Date.now();

    function rotateObject() {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / duration, 1);

        // Rotate the model around its center (anchor point)
        desktopModel.rotation.y += 0.01 * progress;

        if (progress < 1) {
            requestAnimationFrame(rotateObject);
        }
    }

    rotateObject();
}

// Function to fit the camera view to the entire model (ensures it stays in view)
function adjustCameraToFitModel() {
    // Get the bounding box of the model
    const box = new THREE.Box3().setFromObject(desktopModel);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = box.getCenter(new THREE.Vector3());

    // Calculate the camera distance based on the model's size
    const maxSize = Math.max(size.x, size.y, size.z); // Largest dimension
    const distance = maxSize / (2 * Math.tan(Math.PI * camera.fov / 360));

    // Move camera to ensure the whole model fits in the view
    camera.position.set(center.x, center.y, center.z + distance);
    camera.lookAt(center); // Always look at the center of the model
    camera.updateProjectionMatrix();
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Adjust the renderer size and camera aspect ratio on window resize
window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth - 400, window.innerHeight);
    camera.aspect = (window.innerWidth - 400) / window.innerHeight;
    camera.updateProjectionMatrix();

    // Re-adjust camera to fit the model after resizing
    adjustCameraToFitModel();
});

// Start the animation and load the first quiz question
animate();
loadNextQuestion();
