import './assets/main.css';

import {createApp} from 'vue';
import App from './App';
import 'uno.css';
import Loading from "@/Loading.tsx";
//import Website from "@/Website.tsx";
import data from './DataProvider';

createApp(<Loading
        value={
            new Promise((resolve) => {
                setTimeout(()=>{
                    resolve(data);
                },1000)
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
