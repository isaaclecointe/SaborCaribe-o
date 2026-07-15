<template>
  <div ref="mapaRef" class="mapa"></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Corrige los iconos por defecto de Leaflet en Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import fotoNegocio from '../../assets/FotosSucursales/fotoNegocio.jpeg'
import fotoNegocio2 from '../../assets/FotosSucursales/sucursalYupe.jpg'
import fotoNegocio3 from '../../assets/FotosSucursales/Sucursal3.jpeg'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

const mapaRef = ref(null)

// ── Tus 3 ubicaciones ──
const ubicaciones = [
  {
    nombre: 'Sabor Caribeño',
    coords: [14.14382, -89.77517],  // ← ya la tienes
    descripcion: 'Calle principal el Jicaro, Yupiltepeque',
    Horarios: 'Lunes – Sabado: 3:00 pm – 8:00 pm, Domingo: 4:00 pm – 8:00 pm',
    foto: fotoNegocio
  },
  {
    nombre: 'Sabor Caribeño — Sucursal 2',
    coords: [14.195349804387826, -89.79224731804042],      
    descripcion: 'Yupiltepeque, Jutiapa',
    Horarios: 'Lunes – Sabado: 9:00 am – 5:00 pm, Domingo: 9:00 am – 2:00 pm',
    foto: sucursalYupe
  },
  {
    nombre: 'Sabor Caribeño — Sucursal 3',
    coords: [14.175814516065818, -89.74249762638493],    
    descripcion: 'Atescatempa, Jutiapa',
    Horarios: 'Lunes – Domingo: 10:00 am – 9:00 pm',
    foto: sucursal3
  },
]

onMounted(() => {
  // Centra el mapa entre todas las ubicaciones
  const mapa = L.map(mapaRef.value, {
    center: [14.14382, -89.77517],
    zoom: 14,
    zoomControl: true,
    scrollWheelZoom: false
  })

  // Mapa minimalista sin ruido visual
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap © CARTO',
    maxZoom: 19
  }).addTo(mapa)

  // Marcador personalizado con el color de tu marca
  const iconoPersonalizado = L.divIcon({
    className: '',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: #e8621a;
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(232,98,26,0.5);
      "></div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  })

  // Agrega cada marcador al mapa
  ubicaciones.forEach(u => {
    L.marker(u.coords, { icon: iconoPersonalizado })
      .addTo(mapa)
      .bindPopup(`
          <img src="${u.foto}" style="width:200px; height:120px; object-fit:cover; border-radius:8px; display:block; margin-bottom:8px;"/>
          <strong>Sabor Caribeño</strong>
          <div style="font-family: sans-serif; padding: 4px;">
          <strong style="color: #e8621a; font-size: 14px;">${u.nombre}</strong><br/>
          <span style="color: #666; font-size: 20px;">${u.descripcion}</span>
          <span style="color: #666; font-size: 20px;">${u.Horarios}</span>
        </div>
      `)
  })

  // Ajusta el zoom para que entren todos los puntos
  const bounds = L.latLngBounds(ubicaciones.map(u => u.coords))
  mapa.fitBounds(bounds, { padding: [40, 40] })
})
</script>

<style scoped>
.mapa {
  width: 100%;
  height: 450px;
  border-radius: 20px;
  z-index: 0;
}

/* ── Tablet ── */
@media (max-width: 1023px) {
  .mapa {
    height: 350px;
  }
}

/* ── Mobile ── */
@media (max-width: 767px) {
  .mapa {
    height: 260px;
    border-radius: 14px;
  }
}   
    
</style>