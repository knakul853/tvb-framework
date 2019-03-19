from tvb.datatypes.connectivity import Connectivity
from tvb.datatypes.local_connectivity import LocalConnectivity
from tvb.datatypes.mode_decompositions import PrincipalComponents, IndependentComponents
from tvb.datatypes.projections import ProjectionMatrix
from tvb.datatypes.region_mapping import RegionVolumeMapping, RegionMapping
from tvb.datatypes.sensors import Sensors
from tvb.datatypes.simulation_state import SimulationState
from tvb.datatypes.spectral import (
    CoherenceSpectrum, ComplexCoherenceSpectrum,
    FourierSpectrum, WaveletCoefficients
)
from tvb.datatypes.structural import StructuralMRI
from tvb.datatypes.surfaces import Surface
from tvb.datatypes.temporal_correlations import CrossCorrelation
from tvb.datatypes.time_series import TimeSeries, TimeSeriesRegion, TimeSeriesSurface, TimeSeriesVolume
from tvb.datatypes.tracts import Tracts
from tvb.datatypes.volumes import Volume

from tvb.core.entities.file.datatypes.connectivity_h5 import ConnectivityH5
from tvb.core.entities.file.datatypes.local_connectivity_h5 import LocalConnectivityH5
from tvb.core.entities.file.datatypes.mode_decompositions_h5 import PrincipalComponentsH5, IndependentComponentsH5
from tvb.core.entities.file.datatypes.projections_h5 import ProjectionMatrixH5
from tvb.core.entities.file.datatypes.region_mapping_h5 import RegionMappingH5, RegionVolumeMappingH5
from tvb.core.entities.file.datatypes.sensors_h5 import SensorsH5
from tvb.core.entities.file.datatypes.simulation_state_h5 import SimulationStateH5
from tvb.core.entities.file.datatypes.spectral_h5 import (
    CoherenceSpectrumH5, ComplexCoherenceSpectrumH5,
    FourierSpectrumH5, WaveletCoefficientsH5
)
from tvb.core.entities.file.datatypes.structural_h5 import StructuralMRIH5
from tvb.core.entities.file.datatypes.surface_h5 import SurfaceH5
from tvb.core.entities.file.datatypes.temporal_correlations_h5 import CrossCorrelationH5
from tvb.core.entities.file.datatypes.time_series import (
    TimeSeriesH5, TimeSeriesRegionH5, TimeSeriesSurfaceH5,
    TimeSeriesVolumeH5
)
from tvb.core.entities.file.datatypes.tracts_h5 import TractsH5
from tvb.core.entities.file.datatypes.volumes_h5 import VolumeH5
from tvb.interfaces.neocom._registry import Registry


# an alternative approach is to make each h5file declare if it has a corresponding datatype
# then in a metaclass hook each class creation and populate a map
registry = Registry()
registry.register_h5file_datatype(ConnectivityH5, Connectivity)
registry.register_h5file_datatype(LocalConnectivityH5, LocalConnectivity)
registry.register_h5file_datatype(ProjectionMatrixH5, ProjectionMatrix)
registry.register_h5file_datatype(RegionVolumeMappingH5, RegionVolumeMapping)
registry.register_h5file_datatype(RegionMappingH5, RegionMapping)
registry.register_h5file_datatype(SensorsH5, Sensors)
registry.register_h5file_datatype(SimulationStateH5, SimulationState)
registry.register_h5file_datatype(CoherenceSpectrumH5, CoherenceSpectrum)
registry.register_h5file_datatype(ComplexCoherenceSpectrumH5, ComplexCoherenceSpectrum)
registry.register_h5file_datatype(FourierSpectrumH5, FourierSpectrum)
registry.register_h5file_datatype(WaveletCoefficientsH5, WaveletCoefficients)
registry.register_h5file_datatype(StructuralMRIH5, StructuralMRI)
registry.register_h5file_datatype(SurfaceH5, Surface)
registry.register_h5file_datatype(CrossCorrelationH5, CrossCorrelation)
registry.register_h5file_datatype(TimeSeriesH5, TimeSeries)
registry.register_h5file_datatype(TimeSeriesRegionH5, TimeSeriesRegion)
registry.register_h5file_datatype(TimeSeriesSurfaceH5, TimeSeriesSurface)
registry.register_h5file_datatype(TimeSeriesVolumeH5, TimeSeriesVolume)
registry.register_h5file_datatype(TractsH5, Tracts)
registry.register_h5file_datatype(VolumeH5, Volume)
registry.register_h5file_datatype(PrincipalComponentsH5, PrincipalComponents)
registry.register_h5file_datatype(IndependentComponentsH5, IndependentComponents)
