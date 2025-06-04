cmake_minimum_required(VERSION 3.16)
project(MELDNodeWASM)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Emscripten configuration
if(NOT DEFINED CMAKE_TOOLCHAIN_FILE)
    if(NOT DEFINED ENV{EMSCRIPTEN})
        message(FATAL_ERROR "Please set EMSCRIPTEN environment variable to Emscripten installation path")
    endif()
    set(CMAKE_TOOLCHAIN_FILE "$ENV{EMSCRIPTEN}/cmake/Modules/Platform/Emscripten.cmake")
endif()

# Source files
set(SOURCES
    ../fw/main.cpp
    ../sim/hal-wasm.cpp
)

# Include directories
include_directories(
    ../fw
    ../sim
)

# Create WebAssembly executable
add_executable(meld-node ${SOURCES})

# Emscripten-specific flags
set_target_properties(meld-node PROPERTIES
    COMPILE_FLAGS "-O3 -s USE_PTHREADS=1 -s PTHREAD_POOL_SIZE=4"
    LINK_FLAGS "
        -O3
        -s WASM=1 
        -s STANDALONE_WASM=0
        -s EXPORTED_RUNTIME_METHODS=['ccall','cwrap','addFunction','removeFunction','UTF8ToString','stringToUTF8']
        -s EXPORTED_FUNCTIONS=['_wasm_setup','_wasm_loop','_set_ritual_config','_wasm_touch_event','_wasm_nfc_tag','_wasm_nfc_tag_removed','_malloc','_free']
        -s ALLOW_MEMORY_GROWTH=1
        -s INITIAL_MEMORY=16MB
        -s MAXIMUM_MEMORY=32MB
        -s USE_PTHREADS=1
        -s PTHREAD_POOL_SIZE=4
        -s MODULARIZE=1
        -s EXPORT_NAME='MELDNodeWASM'
        -s ENVIRONMENT='web'
        -s NO_EXIT_RUNTIME=1
        -s ASSERTIONS=1
        --pre-js ${CMAKE_SOURCE_DIR}/pre.js
        --post-js ${CMAKE_SOURCE_DIR}/post.js
    "
)

# Custom target for copying output files
add_custom_target(copy_wasm_files ALL
    DEPENDS meld-node
    COMMAND ${CMAKE_COMMAND} -E copy 
        ${CMAKE_BINARY_DIR}/meld-node.wasm 
        ${CMAKE_SOURCE_DIR}/../../public/meld-node.wasm
    COMMAND ${CMAKE_COMMAND} -E copy 
        ${CMAKE_BINARY_DIR}/meld-node.js 
        ${CMAKE_SOURCE_DIR}/../../public/meld-node.js
    COMMAND ${CMAKE_COMMAND} -E copy 
        ${CMAKE_BINARY_DIR}/meld-node.worker.js 
        ${CMAKE_SOURCE_DIR}/../../public/meld-node.worker.js
    COMMENT "Copying WebAssembly files to public directory"
) 