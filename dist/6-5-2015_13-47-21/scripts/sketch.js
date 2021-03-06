 (function(ab){
	"use strict";
	ab.sketch  = function(three){

		var scene = three.scene(),
			camera = three.camera(),
			renderer = three.renderer(),
			composer,
			lightImposter,
			glow,
			ring,
			//controls = new THREE.OrbitControls( camera ),
			shells = [],

			init = function(){
				var geometry,
					material,
					mesh,
					sphereBSP,
					sphereBSP2,
					boxBSP,
					boxBSP2,
					result,
					directionalLight = new THREE.DirectionalLight( 0x005566 ),
					keyLight = new THREE.SpotLight(0xffffff),
					pointLight = new THREE.PointLight( 0xff0099, 1.0, 3 );

				//renderer.setPixelRatio( window.devicePixelRatio );
				renderer.shadowMapEnabled = true;

				scene.add(keyLight);
				
				keyLight.intensity = 1;
				keyLight.distance = 0;
				keyLight.angle = Math.PI / 3;
				keyLight.exponent = 3;
				keyLight.decay = 2;
				
				keyLight.position.set( 0, 10, 5);
				keyLight.target.position.set(0, 0, -5);
				
				keyLight.castShadow = true;
				
				keyLight.shadowMapWidth = 1024;
				keyLight.shadowMapHeight = 1024;

				keyLight.shadowCameraNear = 9;
				keyLight.shadowCameraFar = 13;
				keyLight.shadowCameraFov = 20;
				//keyLight.shadowCameraVisible = true;
				//var slh = new THREE.SpotLightHelper(keyLight);
				//scene.add(slh);

				scene.add(directionalLight);
				directionalLight.position.set( 0, -1, 0.01 );

				scene.add( pointLight );

				geometry = new THREE.PlaneBufferGeometry( 30, 10, 1 );
				material = new THREE.MeshPhongMaterial( { color: 0xffffff } );
				mesh = new THREE.Mesh( geometry, material );
				mesh.position.z = -5;
				scene.add( mesh );

				geometry = new THREE.IcosahedronGeometry( 0.15, 2 );
				material = new THREE.MeshBasicMaterial( { color: 0xff99dd, transparent:true, opacity: 1} );
				lightImposter = new THREE.Mesh( geometry, material );
				scene.add( lightImposter );

				geometry = new THREE.IcosahedronGeometry( 0.3, 2 );
				material = new THREE.MeshBasicMaterial( { color: 0xffffff, transparent:true, opacity: 0.075, blending:THREE.AdditiveBlending} );
				glow = new THREE.Mesh( geometry, material );
				scene.add( glow );

				geometry = new THREE.TorusGeometry( 0.45, 0.01, 8, 32);
				material = new THREE.MeshBasicMaterial( { color: 0xffffff, transparent:true, opacity: 0.075, blending:THREE.AdditiveBlending} );
				ring = new THREE.Mesh( geometry, material );
				scene.add( ring );

				geometry = new THREE.IcosahedronGeometry( 1.5, 2 );
				mesh = new THREE.Mesh( geometry );
				sphereBSP = new ThreeBSP( mesh );

				geometry = new THREE.BoxGeometry( 4, 4, 2);
				mesh = new THREE.Mesh( geometry );
				mesh.position.set(0, 0, -1);
				boxBSP = new ThreeBSP( mesh );

				geometry = new THREE.BoxGeometry( 4, 2, 4);
				mesh = new THREE.Mesh( geometry );
				mesh.position.set(0, -1, 0);
				boxBSP2 = new ThreeBSP( mesh );

				geometry = new THREE.IcosahedronGeometry( 1.4 , 2);
				mesh = new THREE.Mesh( geometry);
				sphereBSP2 = new ThreeBSP( mesh );

				result = sphereBSP
							.subtract( boxBSP )
							.subtract( boxBSP2 )
							.subtract( sphereBSP2 )
							.toMesh( new THREE.MeshPhongMaterial({color: 0x667777, shininess: 40}) );

				for(var i = 6; i < 14; i++){
					var current = result.clone();
					current.scale.multiplyScalar(i/14);
					current.rotation.x =  Math.random() * ( Math.PI * 2 );
					current.rotation.y =  Math.random() * ( Math.PI * 2 );
					current.userData.xVelocity = Math.random() * 0.04 - 0.02;
					current.userData.yVelocity = Math.random() * 0.04 - 0.02;
					current.castShadow = true;
					current.receiveShadow = true;
					scene.add(current);
					shells.push(current);
				}

				camera.position.z = 3;

				// postprocessing
				renderer.autoClear = false;

				composer = new THREE.EffectComposer( renderer );
				composer.addPass( new THREE.RenderPass( scene, camera ) );

				var bloomEffect = new THREE.BloomPass(0.6);
				composer.addPass( bloomEffect );
				
				var effectFXAA = new THREE.ShaderPass( THREE.FXAAShader );
  				effectFXAA.uniforms[ 'resolution' ].value.set( 1 / renderer.domElement.width, 1 / renderer.domElement.height );
  				window.addEventListener('resize', function(){
					effectFXAA.uniforms[ 'resolution' ].value.set( 1 / renderer.domElement.width, 1 / renderer.domElement.height );
				});
				effectFXAA.renderToScreen = true;
				composer.addPass( effectFXAA );

			},
			
			framestart = function(timestamp){
				
			},

			update = function(timestep){
				//controls.update();
				shells.forEach(function(shell){
					shell.rotation.x += shell.userData.xVelocity;
					shell.rotation.z += shell.userData.yVelocity;
				});

				var random = Math.random();

				lightImposter.material.opacity += random * 0.02 - 0.01;
				if(lightImposter.material.opacity < 0.7){
					lightImposter.material.opacity = 0.7;
				}else if(lightImposter.material.opacity > 1){
					lightImposter.material.opacity = 1;
				}

				lightImposter.scale.x = lightImposter.scale.y = lightImposter.scale.z = 0.3 + lightImposter.material.opacity;

				glow.material.opacity += random * 0.02 - 0.01;
				if(glow.material.opacity < 0.05){
					glow.material.opacity = 0.05;
				}else if(glow.material.opacity > 0.1){
					glow.material.opacity = 0.1;
				}

				glow.scale.x = glow.scale.y = glow.scale.z = 1 + glow.material.opacity;

				ring.material.opacity = glow.material.opacity;
				ring.scale.x = ring.scale.y = ring.scale.z = 1 - glow.material.opacity;

			},
			
			draw = function(interpolation){
				composer.render();
				//renderer.render(scene, camera);
			}

		return{
			init: init,
			framestart: framestart,
			update: update,
			draw: draw
		}
	}

}(window.ab = window.ab || {}))