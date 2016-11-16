(function () {
    'use strict';

    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
        return;
    }

    var hud = document.getElementById('hud');
    var container = document.getElementById('container');

    var loadingContainer = document.getElementById('loading-container');
    var loadingMessage = document.getElementById('loading-message');

    var normVertShader = document.getElementById('norm-vert-shader');
    var normFragShader = document.getElementById('norm-frag-shader');

    var scene;
    var renderer;
    var camera;
    var clock;
    var controls;
    var stats;
    
    var rDiv1=2000;
    var rotation1 = Math.floor( Math.random() * rDiv1 ) ;
    var dr1=0.7;	// delta 1
    var rDiv2=2020;
    var rotation2 = Math.floor( Math.random() * rDiv2 ) ;
    var dr2=0.8;	// delta 2
    var distance = 4000;
    
    var moon;
    var starfield;
    var light = {
        speed: 1.2,//0.1,
        distance: 1000,
        position: new THREE.Vector3(0, 0, 0),
        orbit: function (center, time) {
            this.position.x =
                (center.x + this.distance) * Math.sin(time * -this.speed);

            this.position.z =
                (center.z + this.distance) * Math.cos(time * this.speed);
        }
    };

    function createMoon(textureMap, normalMap) {
        var radius = 100;
        var xSegments = 50;
        var ySegments = 50;
        var geo = new THREE.SphereGeometry(radius, xSegments, ySegments);

        var mat = new THREE.ShaderMaterial({
            uniforms: {
                lightPosition: {
                    type: 'v3',
                    value: light.position
                },
                textureMap: {
                    type: 't',
                    value: textureMap
                },
                normalMap: {
                    type: 't',
                    value: normalMap
                },
                uvScale: {
                    type: 'v2',
                    value: new THREE.Vector2(1.0, 1.0)
                }
            },
            vertexShader: normVertShader.innerText,
            fragmentShader: normFragShader.innerText
        });

        var mesh = new THREE.Mesh(geo, mat);
        mesh.geometry.computeTangents();
        mesh.position.set(0, 0, 0);
        mesh.rotation.set(0, 180, 0);
        scene.add(mesh);
        return mesh;
    }

    function createSkybox(texture) {
        var size = 15000;

        var cubemap = THREE.ShaderLib.cube;
        cubemap.uniforms.tCube.value = texture;

        var mat = new THREE.ShaderMaterial({
            fragmentShader: cubemap.fragmentShader,
            vertexShader: cubemap.vertexShader,
            uniforms: cubemap.uniforms,
            depthWrite: false,
            side: THREE.BackSide
        });

        var geo = new THREE.CubeGeometry(size, size, size);
        
        var mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);
        
        return mesh;
    }

    function init() {
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            preserveDrawingBuffer: true
        });

        renderer.setClearColor(0x000000, 1);
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        var fov = 35;
        var aspect = window.innerWidth / window.innerHeight;
        var near = 1;
        var far = 65536;
        
        camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        //camera.position.set(0, 0, 800);
        camera.position.set(0, 60, 800);

        scene = new THREE.Scene();
        scene.add(camera);

        controls = new THREE.TrackballControls(camera);
        controls.rotateSpeed = 0.5;
        controls.dynamicDampingFactor = 0.5;

        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.bottom = '0px';
        hud.appendChild(stats.domElement);

        clock = new THREE.Clock();
    }

    
    function animate() {
        requestAnimationFrame(animate);
//        light.orbit(moon.position, clock.getElapsedTime());
        moon.rotation.set(0, clock.getElapsedTime()/16, 0);
        light.orbit(moon.position, 300);
	  	var angle1=Math.PI*2*rotation1/rDiv1;
	  	if((rotation1+=dr1) >= rDiv1)
	      	rotation1=0;
	  	var angle2=Math.PI*2*rotation2/rDiv2;
	  	if((rotation2+=dr2) >= rDiv2)
	      	rotation2=0;
	  	var h=distance*Math.cos(angle1)*Math.sin(angle2);
	  	var g=distance*Math.sin(angle1)*Math.cos(angle2);
	  	
	  	camera.position.set(h, 60, g);
		//m.lookAt([h,g,f],[px,py,pz],[0,0,-1],vMatrix);
		
        controls.update(camera);
        stats.update();
        renderer.render(scene, camera);
    }

    function toggleHud() {
        hud.style.display = hud.style.display === 'none' ? 'block' : 'none';
    }

    function onDocumentKeyDown (evt) {
        switch (evt.keyCode) {
        case 'H'.charCodeAt(0):
            toggleHud();
            break;
        case 'F'.charCodeAt(0):
            if (screenfull.enabled) screenfull.toggle();
            break;
        case 'P'.charCodeAt(0):
            window.open(renderer.domElement.toDataURL('image/png'));
            break;
        }
    }

    function onWindowResize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }

    function loadAssets(options) {
        var paths = options.paths;
        var onBegin = options.onBegin;
        var onComplete = options.onComplete;
        var onProgress = options.onProgress;
        var total = 0;
        var completed = 0;
        var textures = { };
        var key;

        for (key in paths)
            if (paths.hasOwnProperty(key)) total++;

        onBegin({
            total: total,
            completed: completed
        });

        for (key in paths) {
            if (paths.hasOwnProperty(key)) {
                var path = paths[key];
                if (typeof path === 'string')
                    THREE.ImageUtils.loadTexture(path, null, getOnLoad(path, key));
                else if (typeof path === 'object')
                    THREE.ImageUtils.loadTextureCube(path, null, getOnLoad(path, key));
            }
        }

        function getOnLoad(path, name) {
            return function (tex) {
                textures[name] = tex;
                completed++;
                if (typeof onProgress === 'function') {
                    onProgress({
                        path: path,
                        name: name,
                        total: total,
                        completed: completed
                    });
                }
                if (completed === total && typeof onComplete === 'function') {
                    onComplete({
                        textures: textures
                    });
                }
            };
        }
    }

    /** When the window loads, we immediately begin loading assets. While the
        assets loading Three.JS is initialized. When all assets finish loading
        they can be used to create objects in the scene and animation begins */
    function onWindowLoaded() {
        loadAssets({
            paths: {
                moon: 'img/maps/moon.jpg',
//            	moon: 'img/maps/earth.jpg',
                //moonNormal: 'img/maps/normal.jpg',
/*                starfield: [
                    'img/starfield/front.png',
                    'img/starfield/back.png',
                    'img/starfield/left.png',
                    'img/starfield/right.png',
                    'img/starfield/top.png',
                    'img/starfield/bottom.png'
                ]
                */
            },
            onBegin: function () {
                loadingContainer.style.display = 'block';
            },
            onProgress: function (evt) {
                loadingMessage.innerHTML = evt.name;
            },
            onComplete: function (evt) {
                loadingContainer.style.display = 'none';
                var textures = evt.textures;
                //moon = createMoon(textures.moon, textures.moonNormal);
                moon = createMoon(textures.moon, null);
                starfield = createSkybox(textures.starfield);
                animate();
            }
        });

        init();
    }

    /** Window load event kicks off execution */
    window.addEventListener('load', onWindowLoaded, false);
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', onDocumentKeyDown, false);
})();

onload=function(){
    c=document.getElementById("night_sky");
    setup_canvas(800, 800);
};
