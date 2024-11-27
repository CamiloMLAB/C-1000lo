let font; // Fuente para el texto
let tSize = 200; // Tamaño del texto
let tposY; // Posición en Y, ajustado dinámicamente
let pointCount = 1.5; // Factor de muestra

let speed = 20; // Velocidad de las partículas (aumentada para los emojis)
let comebackSpeed = 150; // Fuerza de atracción (ajustada para suavizar)
let dia = 40; // Diámetro para el comportamiento de 'flee'
let expanded = false; // Control de expansión
let textPoints = []; // Partículas del texto
let emojiParticles = []; // Partículas para los emojis
let emojiImages = []; // Array para guardar las imágenes cargadas
let showEmojis = false; // Control para mostrar los emojis solo después del clic

// Sonido para clics y colisiones con emojis
let soundEffect;

// Nombres de los archivos PNG de emojis
const emojiFiles = ["Star.png", "heart.png", "muscle.png", "pray.png"];

function preload() {
  font = loadFont("AvenirNextLTPro-Demi.otf"); // Fuente personalizada para el texto

  // Cargar imágenes de emojis
  emojiFiles.forEach((file) => {
    emojiImages.push(loadImage("emojis/" + file)); // Cargar cada archivo PNG
  });

  // Cargar el sonido
  soundEffect = loadSound("livechat-129007.mp3");
}

function setup() {
  createCanvas(windowWidth, windowHeight); // Pantalla completa
  textFont(font);
  tposY = height / 3; // Ajustar posición del texto dinámicamente

  // Crear partículas para el texto "Valencia" y "You are not alone"
  createTextParticles();
  // Crear partículas para los emojis
  createEmojiParticles();
}

function draw() {
  background(255, 117, 20);

  // Actualizar y mostrar cada partícula del texto
  textPoints.forEach((v) => {
    v.update();
    v.show();
    v.behaviors();
  });

  // Mostrar emojis solo después del clic
  if (showEmojis) {
    emojiParticles.forEach((emoji, index) => {
      emoji.update();
      emoji.behaviors();
      
      // Verificar si el mouse toca el emoji
      if (dist(mouseX, mouseY, emoji.pos.x, emoji.pos.y) < emoji.size / 2) {
        if (!emoji.hasPlayed) { // Evitar que el sonido se reproduzca varias veces seguidas
          soundEffect.play();
          emoji.hasPlayed = true; // Marcar el emoji como "tocado"
        }
      } else {
        emoji.hasPlayed = false; // Resetear el estado si el mouse se aleja
      }

      if (!expanded && emoji.pos.dist(emoji.target) < 5) {
        // Cuando los emojis regresan al centro, desaparecen
        emojiParticles.splice(index, 1);
      } else {
        emoji.display(); // Mostrar emoji solo si está activo
      }
    });
  }
}

function mousePressed() {
  expanded = !expanded;

  // Reproducir el sonido al hacer clic
  soundEffect.play();

  if (expanded) {
    showEmojis = true; // Habilitar los emojis al hacer clic
    // Expansión de partículas de texto y emojis
    textPoints.forEach((v) => {
      v.target = createVector(random(width), random(height));
      v.vel.mult(0);
      v.acc.mult(0);
    });

    emojiParticles.forEach((emoji) => {
      emoji.pos = createVector(width / 2, height / 2); // Iniciar desde el centro
      emoji.target = createVector(random(width), random(height)); // Expandir hacia posiciones aleatorias
      emoji.vel.mult(0);
      emoji.acc.mult(0);
    });
  } else {
    // Contracción de partículas de texto y emojis
    textPoints.forEach((v) => {
      v.target = v.home.copy();
      v.vel.mult(0);
      v.acc.mult(0);
    });

    emojiParticles.forEach((emoji) => {
      emoji.target = createVector(width / 2, height / 2); // Volver al centro
      emoji.vel.mult(0);
      emoji.acc.mult(0);
    });
  }
}

function createTextParticles() {
  // Obtener las cajas delimitadoras de texto
  let valenciaBounds = font.textBounds("Valencia", 0, 0, tSize);
  let youBounds = font.textBounds("You are not alone", 0, 0, tSize / 2);

  // Calcular posiciones centradas
  let valenciaX = (width - valenciaBounds.w) / 2;
  let valenciaY = tposY;
  let youX = (width - youBounds.w) / 2;
  let youY = valenciaY + valenciaBounds.h + 50;

  // Crear puntos para "Valencia"
  let points1 = font.textToPoints("Valencia", valenciaX, valenciaY + valenciaBounds.h, tSize, {
    sampleFactor: pointCount,
  });

  // Crear puntos para "You are not alone"
  let points2 = font.textToPoints("You are not alone", youX, youY + youBounds.h, tSize / 2, {
    sampleFactor: pointCount,
  });

  // Combinar puntos y crear partículas
  points1.concat(points2).forEach((pt) => {
    let textPoint = new Interact(pt.x, pt.y, speed, dia, false, comebackSpeed);
    textPoints.push(textPoint);
  });
}

function createEmojiParticles() {
  emojiParticles = []; // Limpiar partículas de emojis anteriores

  // Crear partículas de emojis inicialmente invisibles (en el centro)
  for (let i = 0; i < 50; i++) {
    let emojiParticle = new EmojiParticle(
      width / 2, // Iniciar en el centro
      height / 2,
      random(emojiImages) // Elegir una imagen PNG aleatoria
    );
    emojiParticles.push(emojiParticle);
  }
}

// Clase para manejar las partículas de emojis
class EmojiParticle {
  constructor(x, y, img) {
    this.home = createVector(width / 2, height / 2); // Emojis vuelven al centro
    this.pos = createVector(x, y); // Comienza en el centro
    this.target = this.home.copy(); // Objetivo inicial
    this.vel = createVector(random(-5, 5), random(-5, 5)); // Incremento de velocidad
    this.acc = createVector();
    this.size = random(50, 100); // Tamaño aleatorio para las imágenes
    this.img = img; // Imagen asignada
    this.hasPlayed = false; // Control para evitar múltiples reproducciones del sonido
  }

  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

  display() {
    imageMode(CENTER);
    image(this.img, this.pos.x, this.pos.y, this.size, this.size); // Dibujar la imagen
  }

  behaviors() {
    let arrive = this.arrive(this.target);
    let flee = this.flee(createVector(mouseX, mouseY)); // Esquivar el mouse
    this.applyForce(arrive);
    this.applyForce(flee);
  }

  applyForce(f) {
    this.acc.add(f);
  }

  arrive(target) {
    let desired = p5.Vector.sub(target, this.pos);
    let d = desired.mag();
    let speed = this.vel.mag() > 0 ? this.vel.mag() : 5;
    if (d < comebackSpeed) {
      speed = map(d, 0, comebackSpeed, 0, 5);
    }
    desired.setMag(speed);
    let steer = p5.Vector.sub(desired, this.vel);
    return steer;
  }

  flee(target) {
    let desired = p5.Vector.sub(this.pos, target); // Invertir dirección para escapar
    let d = desired.mag();
    if (d < dia * 3) { // Esquivar solo cuando el mouse está cerca
      desired.setMag(speed); // Velocidad alta al escapar
      return p5.Vector.sub(desired, this.vel);
    }
    return createVector(0, 0); // No aplicar fuerza si el mouse está lejos
  }
}

// Clase para manejar las partículas del texto
function Interact(x, y, m, d, t, s) {
  this.home = createVector(x, y);
  this.pos = t ? createVector(random(width), random(height)) : this.home.copy();
  this.target = this.home.copy();
  this.vel = createVector();
  this.acc = createVector();
  this.r = 8;
  this.maxSpeed = m;
  this.maxForce = 1;
  this.dia = d;
  this.come = s;
}

Interact.prototype.behaviors = function () {
  let arrive = this.arrive(this.target);
  this.applyForce(arrive);
};

Interact.prototype.applyForce = function (f) {
  this.acc.add(f);
};

Interact.prototype.arrive = function (target) {
  let desired = p5.Vector.sub(target, this.pos);
  let d = desired.mag();
  let speed = this.maxSpeed;
  if (d < this.come) {
    speed = map(d, 0, this.come, 0, this.maxSpeed);
  }
  desired.setMag(speed);
  let steer = p5.Vector.sub(desired, this.vel);
  steer.limit(this.maxForce);
  return steer;
};

Interact.prototype.update = function () {
  this.pos.add(this.vel);
  this.vel.add(this.acc);
  this.acc.mult(0);
};

Interact.prototype.show = function () {
  stroke(254, 252, 29);
  strokeWeight(4);
  point(this.pos.x, this.pos.y);
};

function windowResized() {
  resizeCanvas(windowWidth, windowHeight); // Ajustar el canvas al cambiar el tamaño de la ventana
}
