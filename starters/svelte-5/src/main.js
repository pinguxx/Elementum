import { mount } from 'svelte';
import '@wcomp/elementum/tokens.css';
import '@wcomp/elementum';
import App from './App.svelte';

mount(App, { target: document.getElementById('app') });
