import './assets/main.css';

import {createApp} from 'vue';
import App from './App';
import 'uno.css';
import Loading from "@/Loading.tsx";
import Card from "@/Card.tsx";
//import Website from "@/Website.tsx";

createApp(<Loading
        value={
            new Promise(resolve => {
                setTimeout(() => resolve([]), 0);
            })
        }
    >
        {
            {
                default: ({...props}) => <App {...props}/>
            }
        }
    </Loading>
).mount('#app');
//createApp(<Website/>).mount('#app');
