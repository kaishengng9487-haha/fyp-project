
        // ===== hangeul LETTERS, SYLLABLES, WORDS =====
        const JAMO_RADIUS = 25;
        const SYL_RADIUS = 35;
        const WORD_RADIUS = 50;

        const JAMOS = ["ㄴ", "ㅏ", "ㅂ", "ㅣ", "ㅇ", "ㅈ", "ㅕ"];

        const hangeul_LEVELS = [
          {name: "ㄴ", radius: JAMO_RADIUS, color: "#f3969a", mass: 2},
          {name: "ㅏ", radius: JAMO_RADIUS, color: "#ffb980", mass: 2},
          {name: "ㅂ", radius: JAMO_RADIUS, color: "#78c2ad", mass: 2},
          {name: "ㅣ", radius: JAMO_RADIUS, color: "#b492cc", mass: 2},
          {name: "ㅇ", radius: JAMO_RADIUS, color: "#8ecae6", mass: 2},
          {name: "ㅈ", radius: JAMO_RADIUS, color: "#f87171", mass: 2},
          {name: "ㅕ", radius: JAMO_RADIUS, color: "#71f8b9", mass: 2},
          // Syllables
          {name: "나", radius: SYL_RADIUS, color: "#3b82f6", mass: 2},
          {name: "바", radius: SYL_RADIUS, color: "#5a0fd3", mass: 2},
          {name: "비", radius: SYL_RADIUS, color: "#22c55e", mass: 2},
          {name: "아", radius: SYL_RADIUS, color: "#f3be2b", mass: 2},
          {name: "녀", radius: SYL_RADIUS, color: "#02804f", mass: 2},
          {name: "안", radius: SYL_RADIUS, color: "#ab47bc", mass: 2},
          {name: "녕", radius: SYL_RADIUS, color: "#ff9800", mass: 2},
          {name: "지", radius: SYL_RADIUS, color: "#1976d2", mass: 2},
          // Words
          {name: "나비", radius: WORD_RADIUS, color: "#b4e197", mass: 2},
          {name: "바나나", radius: WORD_RADIUS, color: "#eebf33", mass: 2},
          {name: "안녕", radius: WORD_RADIUS, color: "#fbc02d", mass: 2},
          {name: "바지", radius: WORD_RADIUS, color: "#81d4fa", mass: 2}
        ];

        const MERGE_RULES = [
          {from: ["ㄴ","ㅏ"], to: "나"},
          {from: ["ㅂ","ㅏ"], to: "바"},
          {from: ["ㅂ","ㅣ"], to: "비"},
          {from: ["ㅇ","ㅏ"], to: "아"},
          {from: ["아","ㄴ"], to: "안"},
          {from: ["ㄴ","ㅕ"], to: "녀"},
          {from: ["녀","ㅇ"], to: "녕"},
          {from: ["ㅈ","ㅣ"], to: "지"},
          {from: ["나","비"], to: "나비"},
          {from: ["바","나","나"], to: "바나나"},
          {from: ["안","녕"], to: "안녕"},
          {from: ["바","지"], to: "바지"}
        ];

        const TARGET_WORDS = [
          {name: "나비", display: "나비 nabi (Butterfly)", id: "word1", syllables: ["비"], jamos: ["ㅂ", "ㅣ"]},
          {name: "바나나", display: "바나나 banana (Banana)", id: "word2", syllables: [], jamos: []},
          {name: "안녕", display: "안녕 annyeong (Hello/Goodbye)", id: "word3", syllables: ["안", "녕", "녀", "아"], jamos: ["ㅇ", "ㅏ", "ㄴ", "ㅕ"]},
          {name: "바지", display: "바지 baji (Pants)", id: "word4", syllables: ["지"], jamos: ["ㅅ", "ㅣ"]}
        ];

        let hangeulCanvas, hangeulCtx, hangeulObjects, hangeulScore, hangeulNextType;
        let hangeulDropping, hangeulGameOver, hangeulGameOverReason, hangeulLastDropTime, hangeulGameWon;
        let destroyTimer = null;
        let completedTargets = {};
        let winDisplayed = false;
        let gameFrozen = false;

        class hangeulLetterObj {
          constructor(type, x, y, vx=0, vy=0) {
            this.type = type;
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.radius = hangeul_LEVELS[type].radius;
            this.mass = hangeul_LEVELS[type].mass;
            this.sleeping = false;
            this.justMerged = false;
          }

          draw(ctx) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
            ctx.closePath();
            ctx.fillStyle = hangeul_LEVELS[this.type].color;
            ctx.fill();
            ctx.lineWidth = 6;
            ctx.strokeStyle = "#fff";
            ctx.stroke();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#000";
            ctx.stroke();
            ctx.fillStyle = "#fff";
            ctx.font = `bold ${Math.max(this.radius,22)}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(hangeul_LEVELS[this.type].name, this.x, this.y);
            ctx.restore();
          }
        }

        function getAllowedJamoTypes() {
          let excluded = new Set();
          for (const target of TARGET_WORDS) {
            if (completedTargets[target.name]) {
              if (Array.isArray(target.jamos)) {
                for (const jamo of target.jamos) {
                  if (jamo !== "ㄴ" && jamo !== "ㅏ" && jamo !== "ㅂ" && jamo !== "ㅣ") {
                    excluded.add(jamo);
                  }
                }
              }
            }
          }
          return JAMOS
            .map((j, idx) => !excluded.has(j) ? idx : null)
            .filter(idx => idx !== null);
        }

        function randomJamoType() {
          const allowed = getAllowedJamoTypes();
          if (allowed.length === 0) return 0;
          return allowed[Math.floor(Math.random() * allowed.length)];
        }

        function hangeulDist(a, b) {
          let dx = a.x-b.x, dy = a.y-b.y;
          return Math.sqrt(dx*dx + dy*dy);
        }

        function getTypeByName(name) {
          return hangeul_LEVELS.findIndex(x => x.name === name);
        }

        function updatehangeulWinStatus() {
          for(let i=0;i<TARGET_WORDS.length;++i) {
            let got = completedTargets[TARGET_WORDS[i].name] === true;
            let label = document.getElementById('hangeul-status-'+TARGET_WORDS[i].id);
            if (label) {
              label.textContent = got ? "Completed!" : "Incomplete";
              label.className = "hangeul-target-status " + (got ? "hangeul-achieved" : "hangeul-not-achieved");
            }
          }
        }

        function destroyAllExistingCompletedTargetsSyllablesAndJamos() {
          for (const target of TARGET_WORDS) {
            if (completedTargets[target.name]) {
              // Remove all instances of the word
              let idx;
              do {
                idx = hangeulObjects.findIndex(obj => hangeul_LEVELS[obj.type].name === target.name);
                if (idx !== -1) hangeulObjects.splice(idx, 1);
              } while (idx !== -1);

              if (Array.isArray(target.syllables)) {
                for (const syll of target.syllables) {
                  let sidx;
                  do {
                    sidx = hangeulObjects.findIndex(obj => hangeul_LEVELS[obj.type].name === syll);
                    if (sidx !== -1 && syll !== "나" && syll !== "바") {
                      hangeulObjects.splice(sidx, 1);
                    }
                  } while (sidx !== -1 && syll !== "나" && syll !== "바");

                  if (
                    hangeulDropping &&
                    hangeul_LEVELS[hangeulDropping.type].name === syll &&
                    syll !== "나" && syll !== "바"
                  ) {
                    hangeulDropping = null;
                  }
                }
              }

              if (Array.isArray(target.jamos)) {
                for (const jamo of target.jamos) {
                  if (jamo === "ㄴ" || jamo === "ㅏ" || jamo === "ㅂ" || jamo === "ㅣ") continue;
                  let jidx;
                  do {
                    jidx = hangeulObjects.findIndex(obj => hangeul_LEVELS[obj.type].name === jamo);
                    if (jidx !== -1) hangeulObjects.splice(jidx, 1);
                  } while (jidx !== -1);

                  if (
                    hangeulDropping &&
                    hangeul_LEVELS[hangeulDropping.type].name === jamo
                  ) {
                    hangeulDropping = null;
                  }
                }
              }
            }
          }
        }

        function freezeGameAndShowWinIfNeeded() {
          let container = document.getElementById("hangeul-target-words-container");
          if (!container) return;
          let allCompleted = TARGET_WORDS.every(tw => completedTargets[tw.name]);
          if (!allCompleted) return;
          if (winDisplayed) return;
          winDisplayed = true;
          gameFrozen = true;

          // Remove old win message if any
          let oldMsg = document.getElementById("hangeul-win-message");
          if (oldMsg) oldMsg.remove();

          // Display win message
          let msg = document.createElement("div");
          msg.id = "hangeul-win-message";
          msg.className = "hangeul-win-message";
          msg.textContent = "축하합니다! (Congratulations!)";
          container.appendChild(msg);

          // Freeze the game container
          let gameContainer = document.getElementById("hangeul-game-canvas").parentElement;
          if (gameContainer) {
            gameContainer.style.pointerEvents = "none";
            gameContainer.style.opacity = "0.5";
          }
        }

        function hangeulGameLoop() {
          if (!gameFrozen) {
            updatehangeulGame();
            drawhangeulGame();
          }
          if (!hangeulGameOver && !hangeulGameWon && !gameFrozen) {
            requestAnimationFrame(hangeulGameLoop);
          }
        }

        function updatehangeulGame() {
          if (hangeulGameOver) return;

          let allObjects = hangeulDropping ? [hangeulDropping, ...hangeulObjects] : [...hangeulObjects];

          for (let f of allObjects) {
            if (f.sleeping) continue;
            f.vy += 0.18;
            f.x += f.vx;
            f.y += f.vy;
          }

          for (let i = 0; i < allObjects.length; ++i) {
            for (let j = i+1; j < allObjects.length; ++j) {
              let a = allObjects[i], b = allObjects[j];
              let dx = a.x - b.x, dy = a.y - b.y;
              let d = Math.sqrt(dx*dx + dy*dy);
              let minDist = a.radius + b.radius;
              if (d < minDist && d > 0.01) {
                let overlap = minDist - d;
                let nx = dx / d, ny = dy / d;
                let totalMass = a.mass + b.mass;
                let aPush = b.mass / totalMass;
                let bPush = a.mass / totalMass;
                a.x += nx * overlap * aPush;
                a.y += ny * overlap * aPush;
                b.x -= nx * overlap * bPush;
                b.y -= ny * overlap * bPush;
                let tx = -ny, ty = nx;
                let va_n = a.vx * nx + a.vy * ny;
                let vb_n = b.vx * nx + b.vy * ny;
                let va_t = a.vx * tx + a.vy * ty;
                let vb_t = b.vx * tx + b.vy * ty;
                let va_n_after = (va_n * (a.mass - b.mass) + 2 * b.mass * vb_n) / (a.mass + b.mass);
                let vb_n_after = (vb_n * (b.mass - a.mass) + 2 * a.mass * va_n) / (a.mass + b.mass);
                a.vx = va_n_after * nx + va_t * tx;
                a.vy = va_n_after * ny + va_t * ty;
                b.vx = vb_n_after * nx + vb_t * tx;
                b.vy = vb_n_after * ny + vb_t * ty;
              }
            }
          }

          for (let f of allObjects) {
            if (f.y + f.radius > hangeulCanvas.height) {
              f.y = hangeulCanvas.height - f.radius;
              if (f.vy > 0) f.vy = 0;
              f.vx *= 0.96;
            }
            if (f.x - f.radius < 0) {
              f.x = f.radius;
              if (f.vx < 0) f.vx = 0;
            }
            if (f.x + f.radius > hangeulCanvas.width) {
              f.x = hangeulCanvas.width - f.radius;
              if (f.vx > 0) f.vx = 0;
            }
            if (f.y - f.radius < 0) {
              f.y = f.radius;
              if (f.vy < 0) f.vy = 0;
            }
          }

          for (let f of allObjects) {
            if (
              !f.sleeping &&
              Math.abs(f.vx) < 0.45 &&
              Math.abs(f.vy) < 0.45 &&
              Math.abs(f.y + f.radius - hangeulCanvas.height) < 0.9
            ) {
              f.vx = 0; f.vy = 0; f.sleeping = true;
            }
          }

          // Merging and completion logic
          let mergedWords = mergehangeulWhenRelevantTouch();

          if (mergedWords && mergedWords.length > 0) {
            mergedWords.forEach(word => {
              if (!completedTargets[word]) {
                completedTargets[word] = true;
                updatehangeulWinStatus();
              }
            });
            
            // Check if all targets are completed and win not displayed
            let allCompleted = TARGET_WORDS.every(tw => completedTargets[tw.name]);
            if (allCompleted && !winDisplayed) {
              freezeGameAndShowWinIfNeeded();
            }

            // Always destroy all completed targets after a short delay (reset timer if already set)
            if (destroyTimer) {
              clearTimeout(destroyTimer);
            }
            destroyTimer = setTimeout(() => {
              destroyAllExistingCompletedTargetsSyllablesAndJamos();
              destroyTimer = null;
            }, 3000);
          }

          if (hangeulDropping && hangeulDropping.sleeping) {
            hangeulObjects.push(hangeulDropping);
            hangeulDropping = null;
          }

          wakeUnsupportedhangeulBalls();
        }

        function mergehangeulWhenRelevantTouch() {
          let didMerge, mergedTargetWords = [];
          do {
            didMerge = false;
            let allObjs = hangeulDropping ? [hangeulDropping, ...hangeulObjects] : [...hangeulObjects];

            for (let rule of MERGE_RULES) {
              let nameCounts = Object.create(null);
              for (let n of rule.from) nameCounts[n] = (nameCounts[n] || 0) + 1;

              let candidates = {};
              for (let name in nameCounts) {
                candidates[name] = [];
                for (let i = 0; i < allObjs.length; ++i) {
                  if (hangeul_LEVELS[allObjs[i].type].name === name) {
                    candidates[name].push(i);
                  }
                }
                if (candidates[name].length < nameCounts[name]) break;
              }

              function* combos(names, sofar=[]) {
                if (names.length === 0) yield sofar;
                else {
                  let n = names[0], rest = names.slice(1), used = new Set(sofar);
                  for (let idx of candidates[n]) {
                    if (!used.has(idx)) {
                      yield* combos(rest, [...sofar, idx]);
                    }
                  }
                }
              }

              let neededNames = [];
              for (let n of rule.from) neededNames.push(n);

              let tried = false;
              for (let idxs of combos(neededNames)) {
                let allTouch = true;
                for (let i = 0; i < idxs.length; ++i) {
                  let touchesAnother = false;
                  for (let j = 0; j < idxs.length; ++j) {
                    if (i === j) continue;
                    let a = allObjs[idxs[i]], b = allObjs[idxs[j]];
                    if (hangeulDist(a, b) <= a.radius + b.radius - 0.1) {
                      touchesAnother = true;
                      break;
                    }
                  }
                  if (!touchesAnother) { allTouch = false; break; }
                }
                if (allTouch) {
                  idxs = Array.from(new Set(idxs)).sort((a,b)=>b-a);
                  for (let idx of idxs) {
                    if (hangeulDropping && idx === 0) hangeulDropping = null;
                    else hangeulObjects.splice(hangeulDropping ? idx-1 : idx, 1);
                  }
                  let xs = idxs.map(i=>allObjs[i].x), ys = idxs.map(i=>allObjs[i].y);
                  let x = xs.reduce((a,b)=>a+b,0)/xs.length, y = ys.reduce((a,b)=>a+b,0)/ys.length;
                  let mergedType = getTypeByName(rule.to);
                  hangeulObjects.push(new hangeulLetterObj(mergedType, x, y, 0, 0));
                  didMerge = true;
                  tried = true;
                  if (TARGET_WORDS.some(tw => tw.name === rule.to)) {
                    mergedTargetWords.push(rule.to);
                  }
                  break;
                }
              }
              if (tried) break;
            }
          } while(didMerge);
          return mergedTargetWords;
        }

        function wakeUnsupportedhangeulBalls() {
          for (let ball of hangeulObjects) {
            if (!ball.sleeping) continue;
            if (Math.abs(ball.y + ball.radius - hangeulCanvas.height) < 0.5) continue;
            let supported = false;
            for (let other of hangeulObjects) {
              if (other === ball) continue;
              if (
                Math.abs(ball.x - other.x) < ball.radius + other.radius - 2 &&
                other.y > ball.y &&
                Math.abs((ball.y + ball.radius) - (other.y - other.radius)) < 0.5
              ) {
                supported = true;
                break;
              }
            }
            if (!supported) {
              ball.sleeping = false;
            }
          }
        }

        function checkhangeulGameOver() {
          for (let f of hangeulObjects) {
            if (f.y - f.radius <= 0) {
              hangeulGameOver = true;
              hangeulGameOverReason = "게임 오버! (Game Over)";
              return;
            }
          }
        }

        function drawhangeulGame() {
          hangeulCtx.clearRect(0,0,hangeulCanvas.width,hangeulCanvas.height);
          for (let f of hangeulObjects) f.draw(hangeulCtx);
          if (hangeulDropping) hangeulDropping.draw(hangeulCtx);
          hangeulCtx.save();
          hangeulCtx.globalAlpha = 0.6;
          hangeulCtx.beginPath();
          hangeulCtx.arc(hangeulCanvas.width-30, 35, hangeul_LEVELS[hangeulNextType].radius, 0, Math.PI*2);
          hangeulCtx.closePath();
          hangeulCtx.fillStyle = hangeul_LEVELS[hangeulNextType].color;
          hangeulCtx.fill();
          hangeulCtx.strokeStyle = "#fff";
          hangeulCtx.lineWidth = 2;
          hangeulCtx.stroke();
          hangeulCtx.fillStyle = "#fff";
          hangeulCtx.font = `bold ${Math.max(hangeul_LEVELS[hangeulNextType].radius,22)}px Arial`;
          hangeulCtx.textAlign = "center";
          hangeulCtx.textBaseline = "middle";
          hangeulCtx.fillText(hangeul_LEVELS[hangeulNextType].name, hangeulCanvas.width-30, 35);
          hangeulCtx.restore();
          hangeulCtx.strokeStyle = "#fff";
          hangeulCtx.strokeRect(hangeulCanvas.width-60, 5, 60, 60);
          hangeulCtx.font = "14px Arial";
          hangeulCtx.fillStyle = "#fff";
          hangeulCtx.fillText("Next", hangeulCanvas.width-30, 75);

          checkhangeulGameOver();
          if ((hangeulGameOver || hangeulGameWon) && hangeulGameOverReason) {
            document.getElementById('hangeul-gameover-message').textContent = hangeulGameOverReason;
          }
        }

        function handlehangeulCanvasClick(e) {
          if (gameFrozen) return;
          const now = Date.now();
          if ((!hangeulDropping && !hangeulGameOver && !hangeulGameWon) || (!hangeulGameOver && !hangeulGameWon && (now - hangeulLastDropTime >= 500))) {
            if (hangeulDropping) {
              hangeulObjects.push(hangeulDropping);
              hangeulDropping = null;
            }
            let rect = hangeulCanvas.getBoundingClientRect();
            let mx = e.clientX - rect.left;
            let x = Math.max(hangeul_LEVELS[hangeulNextType].radius, Math.min(mx, hangeulCanvas.width-hangeul_LEVELS[hangeulNextType].radius));
            hangeulDropping = new hangeulLetterObj(hangeulNextType, x, hangeul_LEVELS[hangeulNextType].radius+4, 0, 0);
            hangeulNextType = randomJamoType();
            hangeulLastDropTime = now;
          } else if (hangeulGameOver || hangeulGameWon) {
            hangeulObjects = [];
            hangeulScore = 0;
            hangeulDropping = null;
            hangeulNextType = randomJamoType();
            hangeulGameOver = false;
            hangeulGameWon = false;
            winDisplayed = false;
            gameFrozen = false;
            hangeulGameOverReason = "";
            destroyTimer = null;
            completedTargets = {};
            document.getElementById('hangeul-gameover-message').textContent = "";
            // Remove win message if exist
            let container = document.getElementById("hangeul-target-words-container");
            if (container) {
              let oldMsg = document.getElementById("hangeul-win-message");
              if (oldMsg) oldMsg.remove();
            }
            // Restore game container UI
            let gameContainer = document.getElementById("hangeul-game-canvas").parentElement;
            if (gameContainer) {
              gameContainer.style.pointerEvents = "";
              gameContainer.style.opacity = "";
            }
            updatehangeulWinStatus();
            hangeulLastDropTime = 0;
            hangeulGameLoop();
          }
        }

        function inithangeulGame() {
          hangeulCanvas = document.getElementById('hangeul-game-canvas');
          if (!hangeulCanvas) return;

          hangeulCtx = hangeulCanvas.getContext('2d');
          hangeulObjects = [];
          hangeulScore = 0;
          hangeulNextType = randomJamoType();
          hangeulDropping = null;
          hangeulGameOver = false;
          hangeulGameWon = false;
          winDisplayed = false;
          gameFrozen = false;
          hangeulGameOverReason = "";
          hangeulLastDropTime = 0;
          destroyTimer = null;
          completedTargets = {};

          document.getElementById('hangeul-target-word1').textContent = TARGET_WORDS[0].display;
          document.getElementById('hangeul-target-word2').textContent = TARGET_WORDS[1].display;
          document.getElementById('hangeul-target-word3').textContent = TARGET_WORDS[2].display;
          document.getElementById('hangeul-target-word4').textContent = TARGET_WORDS[3].display;
          hangeulCanvas.addEventListener('click', handlehangeulCanvasClick);

          updatehangeulWinStatus();
          hangeulGameLoop();
        }

        document.addEventListener('DOMContentLoaded', function() {
          setTimeout(inithangeulGame, 100);
        });