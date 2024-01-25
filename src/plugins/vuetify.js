// Styles
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";

// Vuetify
import {createVuetify} from "vuetify";
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import {mdi, aliases} from "vuetify/iconsets/mdi";

const vuetify = createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: "dark"
    }
});

export default vuetify;
