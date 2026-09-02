import { configureStore } from "@reduxjs/toolkit";
import { getDataReducer } from "./getData";

const store = configureStore({
    reducer: {
        getData: getDataReducer
    }
})

export default store