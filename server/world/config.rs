use serde::{Deserialize, Serialize};

#[derive(Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InitConfig {
    /// The horizontal dimension of the chunks in this world. Default is 16 blocks wide.
    pub chunk_size: usize,

    /// Max height of the world. Default is 256 blocks high.
    pub max_height: usize,

    /// Max light level that light can propagate. Default is 15 blocks.
    pub max_light_level: u32,

    /// The minimum inclusive chunk on this world. Default is [i32::MIN, i32::MIN].
    pub min_chunk: [i32; 2],

    /// The maximum inclusive chunk on this world. Default is [i32::MAX, i32::MAX].
    pub max_chunk: [i32; 2],
}

/// World configuration, storing information of how a world is constructed.
#[derive(Clone, Default)]
pub struct WorldConfig {
    /// Max clients for each world. Default is 100 clients.
    pub max_clients: usize,

    /// Interval that this world ticks on. Default is 16ms.
    pub interval: u64,

    /// The horizontal dimension of the chunks in this world. Default is 16 blocks wide.
    pub chunk_size: usize,

    /// The minimum inclusive chunk on this world. Default is [i32::MIN, i32::MIN].
    pub min_chunk: [i32; 2],

    /// The maximum inclusive chunk on this world. Default is [i32::MAX, i32::MAX].
    pub max_chunk: [i32; 2],

    /// Max height of the world. Default is 256 blocks high.
    pub max_height: usize,

    /// Max light level that light can propagate. Default is 15 blocks.
    pub max_light_level: u32,

    /// Maximum chunks to be processed per tick. Default is 24 chunks.
    pub max_chunk_per_tick: usize,

    /// Maximum voxel updates to be processed per tick. Default is 500 voxels.
    pub max_updates_per_tick: usize,

    /// Maximum responses to send to client per tick to prevent bottle-necking. Default is 4 chunks.
    pub max_response_per_tick: usize,

    /// Radius of chunks around `0,0` to be preloaded. Default is 8 chunks.
    pub preload_radius: u32,

    /// Gravity of the voxelize world.
    pub gravity: [f32; 3],

    /// Minimum impulse to start bouncing.
    pub min_bounce_impulse: f32,

    /// Drag of the air in the voxelize world.
    pub air_drag: f32,

    /// Drag of the fluid in the voxelize world.
    pub fluid_drag: f32,

    /// Fluid density of the voxelize world.
    /// TODO: move this to registry.
    pub fluid_density: f32,

    /// Seed of the world. Default is "Voxelize".
    pub seed: i32,
}

impl WorldConfig {
    /// Create a new world config using the Builder pattern.
    ///
    /// # Example
    ///
    /// ```
    /// let config = WorldConfig::new().chunk_size(8).max_height(64).build();
    /// server.create_world("small-world", &config);
    /// ```
    pub fn new() -> WorldConfigBuilder {
        WorldConfigBuilder::new()
    }

    /// Get the INIT configurations
    pub fn get_init_config(&self) -> InitConfig {
        InitConfig {
            chunk_size: self.chunk_size,
            max_height: self.max_height,
            max_light_level: self.max_light_level,
            min_chunk: self.min_chunk,
            max_chunk: self.max_chunk,
        }
    }
}

const DEFAULT_MAX_CLIENT: usize = 100;
const DEFAULT_INTERVAL: u64 = 8;
const DEFAULT_CHUNK_SIZE: usize = 16;
const DEFAULT_MIN_CHUNK: [i32; 2] = [i32::MIN + 1, i32::MIN + 1];
const DEFAULT_MAX_CHUNK: [i32; 2] = [i32::MAX - 1, i32::MAX - 1];
const DEFAULT_MAX_HEIGHT: usize = 256;
const DEFAULT_MAX_LIGHT_LEVEL: u32 = 15;
const DEFAULT_MAX_CHUNKS_PER_TICK: usize = 24;
const DEFAULT_MAX_UPDATES_PER_TICK: usize = 500;
const DEFAULT_MAX_RESPONSE_PER_TICK: usize = 3;
const DEFAULT_PRELOAD_RADIUS: u32 = 8;
const DEFAULT_SEED: i32 = 123123123;
const DEFAULT_GRAVITY: [f32; 3] = [0.0, -9.8, 0.0];
const DEFAULT_MIN_BOUNCE_IMPULSE: f32 = 0.1;
const DEFAULT_AIR_DRAG: f32 = 0.1;
const DEFAULT_FLUID_DRAG: f32 = 0.4;
const DEFAULT_FLUID_DENSITY: f32 = 2.0;

/// Builder for a world configuration.
pub struct WorldConfigBuilder {
    max_clients: usize,
    interval: u64,
    chunk_size: usize,
    min_chunk: [i32; 2],
    max_chunk: [i32; 2],
    max_height: usize,
    max_light_level: u32,
    max_chunk_per_tick: usize,
    max_updates_per_tick: usize,
    max_response_per_tick: usize,
    preload_radius: u32,
    seed: i32,
    gravity: [f32; 3],
    min_bounce_impulse: f32,
    air_drag: f32,
    fluid_drag: f32,
    fluid_density: f32,
}

impl WorldConfigBuilder {
    /// Create a new WorldConfigBuilder with default values.
    pub fn new() -> Self {
        Self {
            max_clients: DEFAULT_MAX_CLIENT,
            interval: DEFAULT_INTERVAL,
            chunk_size: DEFAULT_CHUNK_SIZE,
            min_chunk: DEFAULT_MIN_CHUNK,
            max_chunk: DEFAULT_MAX_CHUNK,
            max_height: DEFAULT_MAX_HEIGHT,
            max_light_level: DEFAULT_MAX_LIGHT_LEVEL,
            max_chunk_per_tick: DEFAULT_MAX_CHUNKS_PER_TICK,
            max_updates_per_tick: DEFAULT_MAX_UPDATES_PER_TICK,
            max_response_per_tick: DEFAULT_MAX_RESPONSE_PER_TICK,
            preload_radius: DEFAULT_PRELOAD_RADIUS,
            seed: DEFAULT_SEED,
            air_drag: DEFAULT_AIR_DRAG,
            fluid_drag: DEFAULT_FLUID_DRAG,
            fluid_density: DEFAULT_FLUID_DENSITY,
            gravity: DEFAULT_GRAVITY,
            min_bounce_impulse: DEFAULT_MIN_BOUNCE_IMPULSE,
        }
    }

    /// Configure the maximum clients allowed for this world. Defaults is 100 clients.
    pub fn max_clients(mut self, max_clients: usize) -> Self {
        self.max_clients = max_clients;
        self
    }

    /// Configure the rate at which this world ticks. Default is 16ms.
    pub fn interval(mut self, interval: u64) -> Self {
        self.interval = interval;
        self
    }

    /// Configure the horizontal dimension of chunks in this world. Default is 16 blocks wide.
    pub fn chunk_size(mut self, chunk_size: usize) -> Self {
        self.chunk_size = chunk_size;
        self
    }

    /// Configure the minimum inclusive chunk of the world. Default is [i32::MIN, i32::MIN].
    pub fn min_chunk(mut self, min_chunk: [i32; 2]) -> Self {
        self.min_chunk = min_chunk;
        self
    }

    /// Configure the maximum inclusive chunk of the world. Default is [i32::MAX, i32::MAX].
    pub fn max_chunk(mut self, max_chunk: [i32; 2]) -> Self {
        self.max_chunk = max_chunk;
        self
    }

    /// Configure the maximum height of the world. Default is 256 blocks high.
    pub fn max_height(mut self, max_height: usize) -> Self {
        self.max_height = max_height;
        self
    }

    /// Configure the maximum light level that propagates the world. Default is 15 blocks.
    pub fn max_light_level(mut self, max_light_level: u32) -> Self {
        self.max_light_level = max_light_level;
        self
    }

    /// Configure the maximum amount of chunks to be processed per tick. Default is 24 chunks.
    pub fn max_chunk_per_tick(mut self, max_chunk_per_tick: usize) -> Self {
        self.max_chunk_per_tick = max_chunk_per_tick;
        self
    }

    /// Configure the maximum amount of voxel updates to be processed per tick. Default is 500 voxel updates.
    pub fn max_updates_per_tick(mut self, max_updates_per_tick: usize) -> Self {
        self.max_updates_per_tick = max_updates_per_tick;
        self
    }

    /// Configure the maximum amount of chunks to be sent to the client per tick. Default is 3 chunks.
    pub fn max_response_per_tick(mut self, max_response_per_tick: usize) -> Self {
        self.max_response_per_tick = max_response_per_tick;
        self
    }

    /// Configure the radius around `0,0` for the world to preload chunks in. Default is 8 chunks.
    pub fn preload_radius(mut self, preload_radius: u32) -> Self {
        self.preload_radius = preload_radius;
        self
    }

    /// Configure the seed of the world. Default is "Voxelize".
    pub fn seed(mut self, seed: i32) -> Self {
        self.seed = seed;
        self
    }

    /// Create a world configuration.
    pub fn build(self) -> WorldConfig {
        // Make sure there are still chunks in the world.
        if self.max_chunk[0] < self.min_chunk[0] || self.max_chunk[1] < self.min_chunk[1] {
            panic!("Min/max chunk parameters do not make sense.");
        }

        WorldConfig {
            max_clients: self.max_clients,
            interval: self.interval,
            chunk_size: self.chunk_size,
            max_height: self.max_height,
            max_light_level: self.max_light_level,
            max_chunk_per_tick: self.max_chunk_per_tick,
            max_updates_per_tick: self.max_updates_per_tick,
            max_response_per_tick: self.max_response_per_tick,
            preload_radius: self.preload_radius,
            seed: self.seed,
            min_chunk: self.min_chunk,
            max_chunk: self.max_chunk,
            air_drag: self.air_drag,
            fluid_drag: self.fluid_drag,
            fluid_density: self.fluid_density,
            gravity: self.gravity,
            min_bounce_impulse: self.min_bounce_impulse,
        }
    }
}