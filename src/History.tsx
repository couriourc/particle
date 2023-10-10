import {defineComponent, onMounted} from "vue";

export default defineComponent({
    setup() {
        onMounted(async () => {
            await import('./scripts/jquery');
            await import('./scripts/plugins');
            await import('./scripts/int');
            await import('./scripts/scripts');
        });

        return () => <>

            <div id="loading">
                <div class="icon"></div>
                LOADING HISTORY...
            </div>
            <div id="dontknow"></div>
            <canvas id="canvas"></canvas>
            <div id="graph_tip">
                <p>
                    Welcome to Histography
                    <br/>where every dot is a historic event from wikipedia
                    <br/>
                    <br/>You are now viewing history from 1600 - 2000
                    <br/>Resize the bottom bar to view any time period or era
                </p>
                <div class="arrow"></div>
            </div>
            <div id="round_tip">
                <p>
                    This screen will show you selected events
                    <br/>
                    throughout history
                    <br/><br/>
                    Scroll through the events on the left<br/> The more you move, the further you will delve into
                    history
                    <br/>
                    <span class="gotit">Got It</span>
                </p>
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
                    <a href="http://cargocollective.com/matanstauber/Histography" target="_blank"><span
                        class="about">About</span></a>
                    <span class="space">&#9900</span>
                    <span class="wiki">Based On Wikipedia</span>
                    <span class="space">&#9900</span> <span class="sound">Sound On</span>
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
                        <span class="space">&#9900</span>
                        <span class="sound">Sound On</span>

                    </div>
                </div>
                <div id="round_year">2015</div>
                <div class="toptext"></div>
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

        </>;
    }
});
