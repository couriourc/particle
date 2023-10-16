import {defineComponent, onMounted} from "vue";
import './index.css';


export default defineComponent({
    setup() {
        onMounted(async () => {
            await import('https://code.jquery.com/jquery-1.10.2.min.js');
            await import('./plugins.js');
            await import('./int.js');
            await import('./script.js');
        });
        return () => <>

            <div id="loading">
                <div class="icon"></div>
                LOADING HISTORY...
            </div>
            <div id="dontknow"></div>
            <canvas id="canvas"></canvas>
            <div id="graph_tip">
                <div class="arrow"></div>
            </div>
            <div id="round_tip">
                <div class="gotit">Got It</div>
            </div>
            <div id="texture"></div>
            <div id="mouse_move" class="zoom">
                <div id="current_year"></div>
                <div id="line"></div>
                <div id="cursor"></div>
            </div>
            <div id="hover_event"></div>
            <div id="mvps"></div>
            <div id="graph_menu" class="menu">
                <div class="content">
                    <div class="logo"></div>
                    <h2 id="graph_h2"></h2>
                    <ul></ul>
                </div>
            </div>
            <div id="round_menu" class="menu">
                <div class="content">
                    <div class="logo"></div>
                    <h2 id="round_h2"></h2>
                    <div id="round_selected"></div>
                    <ul></ul>
                    <div id="dice">FEELING LUCKY</div>
                </div>
            </div>
            <div id="footer">
                <div id="periods">
                    <ul>
                        <li>The Beginning</li>
                        <li>/ Earth Formation</li>
                        <li>/ Seeds Of Life</li>
                        <li>/ Age Of Fish</li>
                        <li>/ Age Of Reptiles</li>
                        <li>/ Age Of Mammals</li>
                        <li>/ Stone Age</li>
                        <li>/ Bronze Age</li>
                        <li>/ Iron Age</li>
                        <li>/ Middle Ages</li>
                        <li>/ Renaissance</li>
                        <li>/ Industrial Age</li>
                        <li>/ Information Age</li>
                    </ul>
                </div>
                <div id="slider_years">
                    <div>1998</div>
                    <div>1999</div>
                </div>
                <div id="slider_container">
                    <div id="slider"></div>
                </div>
            </div>
            <div id="screen1">
                <div id="graph_toptext">
                    <a href="http://cargocollective.com/matanstauber/Histography" target="_blank">
                        <span class="about">About</span>
                    </a>
                    <span class="space">&#9900</span>
                    <span class="wiki">Based On Wikipedia</span>
                    <span class="space">&#9900</span>
                    <span class="sound">Sound On</span>
                </div>
            </div>
            <div id="screen2">
                <div id="round">
                    <div id="round_toptext">
                        <a href="http://cargocollective.com/matanstauber/Histography" target="_blank">
                            <span class="about">About</span>
                        </a>
                        <span class="space">&#9900</span>
                        <span class="wiki">Based On Wikipedia</span>
                        <span class="space">&#9900</span> <span class="sound">Sound On</span>
                    </div>
                    <div id="round_year">2015</div>
                    <div class="toptext"></div>
                </div>
            </div>
            <div id="home">
                <div id="matan"><a href="http://cargocollective.com/matanstauber" target="_blank">By Matan Stauber</a>
                </div>
                <div id="logo_container">
                    <div class="logo_animated"></div>
                    <div class="text">
                        <h1>Histography <span>[BETA]</span></h1>
                        <h2>INTERACTIVE TIMELINE OF HISTORY</h2>
                    </div>
                </div>
                <div id="round_description">
                    <div class="line"></div>
                    <h3>Editorial Stories</h3>
                    <p>Discover Handpicked Stories from The Entire History</p>
                </div>
                <div id="graph_description">
                    <div class="line"></div>
                    <h3>EVERYTHING</h3>
                    <p>Every Historical Event</p>
                </div>
            </div>

            <audio id="audio_sand" loop>
                <source src="audio/sand.mp3"></source>
            </audio>
            <audio id="audio_modes">
                <source src="audio/modes.mp3"></source>
            </audio>
            <audio id="audio_tap">
                <source src="audio/tap.mp3"></source>
            </audio>
            <audio id="audio_zoom">
                <source src="audio/zoom.mp3"></source>
            </audio>
            <audio id="audio_background" id="audio_background" loop>
                <source src="audio/background.mp3"></source>
            </audio>
        </>;
    }

});

//
//        <script src="https://code.jquery.com/jquery-1.10.2.min.js"></script>
//        <script src="plugins.js"></script>
//        <script>
//            loader_stuck = setInterval(function() {
//            location.reload()
//        }, 3e4)
//        </script>
//        <script src="int.js"></script>
//        <script src="script.js"></script>
