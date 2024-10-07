let entities
let entityCount
let images = []
let huntTime
let speed = 2

function preload() {
    for(i = 0; i<5; i++) {
        images.push(loadImage("images/life_"+i+".png"))
    }
}

function setup() {
    let cnvs = createCanvas(windowWidth-15, windowHeight*0.9)
    cnvs.parent('canvas')
    colorMode(HSB, 100)
    imageMode(CENTER)
    noSmooth()

    entityCount = 0
    huntTime = false
    entities = []
    entities.push(new Plant(0, 0, {color: {hue: 90, sat: 100, bri: 100}, wait: 60, life: 4500}))
    entities.push(new Prey(width*0.1, 0, 0, {health: 100, color: {hue: 50, sat: 100, bri: 100}, age: 1}))
    entities.push(new Prey(-width*0.1, 0, 1, {health: 100, color: {hue: 50, sat: 100, bri: 100}, age: 1}))
}

function draw() {
    background(0)
    translate(width/2, height/2)

    for(i=0; i<speed; i++) {
        tick()
    }

    translate(-width/2, -height/2)
    fill('white')
    textAlign(LEFT, TOP)
    text(entityCount+' entities', 5, 5)
}

function tick() {
    entities.forEach((e) => {
        if(e.type=="Plant" && JSON.stringify(e) != '{}') e.draw()
    })
    entities.forEach((e) => {
        if(e.type=="Prey" && JSON.stringify(e) != '{}') e.draw()
        if(e.type=="Predator" && JSON.stringify(e) != '{}') e.draw()
    })
    if(entityCount < 2 || frameRate() <= 10) setup()

    if(entityCount > 30 && !(huntTime)) {
        entities.push(new Predator(width*0.1, -height/2, 0, {health: 100, color: {hue: 0, sat: 50, bri: 100}, age: 1}))
        entities.push(new Predator(-width*0.1, -height/2, 1, {health: 100, color: {hue: 0, sat: 50, bri: 100}, age: 1}))
        huntTime = true
    }
}

class Predator {
    constructor(x, y, gender, dna) {
        entityCount++
        this.type = "Predator"
        this.id = entities.length
        this.x = x
        this.y = y
        this.velX = 0
        this.velY = 0
        this.width = max(width/40, height/40)
        this.height = this.width
        this.dna = dna
        this.health = dna.health
        this.color = dna.color
        this.food = 1
        this.mood = 0
        this.age = dna.age
        this.gender = gender
        this.ermCooldown = 0
        this.vision = {}
    }
    draw() {
        this.look()
        this.move()
        this.logic()
        push()

        translate(this.x, this.y)
        rectMode(CENTER)
        fill(this.color.hue, this.color.sat, this.color.bri)
        stroke(this.color.hue, this.color.sat, 50)
        strokeWeight(this.width/30)
        rect(0, 0, this.width*min(this.age,1), this.height*min(this.age,1))
        image(images[this.mood], 0, 0, this.width*0.7*min(this.age,1), this.height*0.7*min(this.age,1))

        pop()
    }
    move() {
        //go to something
        if(JSON.stringify(this.vision) != '{}') {
            this.velX += (this.vision.x-this.x)/40
            this.velY += (this.vision.y-this.y)/40
            this.velX /= 2
            this.velY /= 2
        } else {
            //wander
            this.velX += random(-0.1, 0.1)
            this.velY += random(-0.1, 0.1)
            this.velX %= 1
            this.velY %= 1
        }

        //walls
        if(this.x > width/2) this.velX = -1
        if(this.x < -width/2) this.velX = 1
        if(this.y > height/2) this.velY = -1
        if(this.y < -height/2) this.velY = 1

        //update
        this.x += this.velX
        this.y += this.velY
    }
    logic() {
        //food
        if(this.touching("Prey") && this.food < 10) {
            //I really don't care that it can go over 10
            this.food += 1
            if(entities[this.vision.id] != undefined) entities[this.vision.id].health = 0
        }
        if(this.food > 0 && frameCount%60 == 0) this.food -= 0.1
        if(this.food <= 0) this.health--

        //mood
        if(this.food <= 3.5) {
            //sad
            this.mood = 2
        } else if(this.food <= 5.5) {
            //meh
            this.mood = 0
        } else {
            //happy
            this.mood = 1
        }
        if(this.vision.type == this.type) this.mood = 4
        if(this.vision.type == "Prey") this.mood = 3

        //age
        this.age+=0.001
        if(this.age >= 7) this.health--

        //health
        if(this.health <= 0) {
            entities[this.id] = {}
            entityCount--
        }

        //erm
        if(this.touching(this.type) && this.mood == 4) {
            if(this.vision.mood == 4) {
                if(this.gender == 0) {
                    if(round(random(1, 2)) == 1) entities.push(new Predator(this.x, this.y, round(random(0, 1)), this.newDna()))
                }
                this.ermCooldown = round(random(270, 330))
                this.health -= round(random(5, -10))
            }
        }
        if(this.ermCooldown>0) this.ermCooldown--
    }
    look() {
        this.vision = {}
        let bestDist = max(width, height)
        entities.forEach((e) => {
            let thisDist = max(this.x-e.x, this.y-e.y)
            if(e!=this && thisDist <= bestDist || e.type != this.vision.type) {
                if(e.type == "Prey" && (this.mood==2 || this.mood == 0)) {
                    let temp = {}
                    temp.x = e.x
                    temp.y = e.y
                    temp.type = e.type
                    temp.id = e.id
                    this.vision = temp
                }
                if(e.type == this.type && e.age>1 && e.gender != this.gender && this.food>5 && this.age >= 1 && this.ermCooldown == 0) {
                    let temp = {}
                    temp.x = e.x
                    temp.y = e.y
                    temp.type = e.type
                    temp.mood = e.mood
                    this.vision = temp
                }
                bestDist = thisDist
            }
        })
    }
    touching(type) {
        let temp = false
        entities.forEach((e) => {
            if(e.type == type && e != this) {
                let x = Math.abs(this.x-e.x)
                let y = Math.abs(this.y-e.y)
                if(x <= this.width/2+e.width/2 && y <= this.height/2+e.width/2) temp = true
            }
        })
        return temp
    }
    newDna() {
        let temp = JSON.parse(JSON.stringify(this.dna))
        temp.age = 0.5
        temp.color.hue += round(random(-4, 4))
        this.color.hue %= 100
        temp.health += round(random(-10, 10))

        return temp
    }
}

class Prey {
    constructor(x, y, gender, dna) {
        entityCount++
        this.type = "Prey"
        this.id = entities.length
        this.x = x
        this.y = y
        this.velX = 0
        this.velY = 0
        this.width = max(width/40, height/40)
        this.height = this.width
        this.dna = dna
        this.health = dna.health
        this.color = dna.color
        this.food = 1
        this.mood = 0
        this.age = dna.age
        this.gender = gender
        this.ermCooldown = 0
        this.poopCooldown = round(random(500, 700))
        this.poop = {}
        this.vision = {}
    }
    draw() {
        this.look()
        this.move()
        this.logic()
        push()

        translate(this.x, this.y)
        ellipseMode(CENTER)
        fill(this.color.hue, this.color.sat, this.color.bri)
        stroke(this.color.hue, this.color.sat, 50)
        strokeWeight(this.width/30)
        ellipse(0, 0, this.width*min(this.age,1), this.height*min(this.age,1))
        image(images[this.mood], 0, 0, this.width*0.7*min(this.age,1), this.height*0.7*min(this.age,1))

        pop()
    }
    move() {
        //go to something
        if(JSON.stringify(this.vision) != '{}') {
            this.velX += (this.vision.x-this.x)/40
            this.velY += (this.vision.y-this.y)/40
            this.velX /= 2
            this.velY /= 2
        } else {
            //wander
            this.velX += random(-0.1, 0.1)
            this.velY += random(-0.1, 0.1)
            this.velX %= 1
            this.velY %= 1
        }

        //walls
        if(this.x > width/2) this.velX = -1
        if(this.x < -width/2) this.velX = 1
        if(this.y > height/2) this.velY = -1
        if(this.y < -height/2) this.velY = 1

        //update
        this.x += this.velX
        this.y += this.velY
    }
    logic() {
        //food
        if(this.touching("Plant") && frameCount%30 == 0 && this.food < 10) {
            this.food++
        }
        if(this.food > 0 && frameCount%60 == 0) this.food -= 0.1
        if(this.food <= 0) this.health--

        //mood
        if(this.food <= 3) {
            //sad
            this.mood = 2
        } else if(this.food <= 7) {
            //meh
            this.mood = 0
        } else {
            //happy
            this.mood = 1
        }
        if(this.vision.type == "Prey") {
            this.mood = 4
        }

        //age
        this.age+=0.003
        if(this.age >= 10) this.health--

        //health
        if(this.health <= 0) {
            entities[this.id] = {}
            entityCount--
        }

        //erm
        if(this.touching("Prey") && this.mood == 4) {
            if(this.vision.mood == 4) {
                if(this.gender == 0) {
                    if(round(random(1, 2)) == 1) entities.push(new Prey(this.x, this.y, round(random(0, 1)), this.newDna()))
                }
                this.ermCooldown = round(random(60, 360))
                this.health -= round(random(5, -10))
            }
        }
        if(this.ermCooldown>0) this.ermCooldown--

        //poop
        if(this.poopCooldown<=0 && JSON.stringify(this.poop) != '{}') {
            entities.push(new Plant(this.x, this.y, this.poop))
            this.poopCooldown = round(random(1200, 1500))
            this.poop = {}
        }
        this.poopCooldown--
    }
    look() {
        this.vision = {}
        let bestDist = max(width, height)
        entities.forEach((e) => {
            let thisDist = max(this.x-e.x, this.y-e.y)
            if(e!=this && thisDist <= bestDist || e.type != this.vision.type) {
                if(e.type == "Plant" && this.food<3) {
                    let temp = {}
                    temp.x = e.x
                    temp.y = e.y
                    temp.type = e.type
                    this.vision = temp
                    this.poop = e.seed()
                }
                if((round(random(1,5))==1 || this.mood == 4) && e.type == this.type && e.age>1 && e.gender != this.gender && this.food>5 && this.age >= 1 && this.ermCooldown == 0) {
                    let temp = {}
                    temp.x = e.x
                    temp.y = e.y
                    temp.type = e.type
                    temp.mood = e.mood
                    this.vision = temp
                }
                bestDist = thisDist
            }
        })
    }
    touching(type) {
        let temp = false
        entities.forEach((e) => {
            if(e.type == type && e != this) {
                let x = Math.abs(this.x-e.x)
                let y = Math.abs(this.y-e.y)
                if(x <= this.width/2+e.width/2 && y <= this.height/2+e.width/2) temp = true
            }
        })
        return temp
    }
    newDna() {
        let temp = JSON.parse(JSON.stringify(this.dna))
        temp.age = 0.5
        temp.color.hue += round(random(-4, 4))
        this.color.hue %= 100
        temp.health += round(random(-10, 10))

        return temp
    }
}

class Plant {
    constructor(x, y, dna) {
        entityCount++
        this.type = "Plant"
        this.id = entities.length
        this.x = x
        this.y = y
        this.width = max(width/35, height/35)
        this.height = this.width/2
        this.dna = dna
        this.color = dna.color
        this.wait = dna.wait
        this.life = dna.life
    }
    draw() {
        push()

        rectMode(CENTER)
        fill((this.color.hue+50)%100, this.color.sat, this.color.bri)
        stroke((this.color.hue+50)%100, this.color.sat, 50)
        strokeWeight(this.width/30)
        rect(this.x, this.y, this.width, this.height)

        fill(this.color.hue, this.color.sat, this.color.bri)
        stroke(this.color.hue, this.color.sat, 75)
        strokeWeight(this.width/50)
        rect(this.x-this.width/4, this.y+this.height/5, this.width/7, this.height/3)
        rect(this.x+this.width/4, this.y+this.height/5, this.width/7, this.height/3)
        rect(this.x, this.y-this.height/5, this.width/7, this.height/3)

        pop()

        this.life--
        if(this.life<0) {
            entities[this.id] = {}
            entityCount--
        }
    }
    seed() {
        let temp = {}
        temp.color = JSON.parse(JSON.stringify(this.color))
        temp.color.hue = (this.color.hue+round(random(-2, 2)))%100
        temp.wait = this.wait+round(random(-10, 10))
        temp.life = this.dna.life+round(random(-200, 200))
        
        if(temp.wait<10) temp.wait += round(random(10, 20))
        return temp
    }
}