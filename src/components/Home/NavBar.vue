<template>
  <header class="header">
    <div class="logo">
      <img src="../../assets/Logo.svg" alt="logo" class="img-logo">
    </div>

    <nav class="navegacion">
      <ul class="nav-nombres">
        <li class="Menu">Nuestro Menu</li>
        <li class="acerca">A cerca de</li>
      </ul>
    </nav>
  </header>
</template>

<style scoped>
.img-logo {
  width: 100px;
  height: 100px;
  transition: all 0.3s;
}

.img-logo:hover {
  transform: scale(1.2);
}

header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 120px;
  padding: 5px 10%;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
  border-radius: 20px;
  box-sizing: border-box;
  width: 100%;
  background: #fff;
}

.nav-nombres {
  list-style: none;
  display: flex;        /* ← los li en fila */
  gap: 24px;            /* ← espacio entre items */
  margin: 0;
  padding: 0;
}

.Menu {
  color: rgb(207, 0, 86);
  cursor: pointer;
}

.acerca {
  color: rgb(178, 238, 39);
  cursor: pointer;
}

/* Tablet */
@media (max-width: 768px) {
  header {
    padding: 5px 5%;
    height: 100px;
  }

  .img-logo {
    width: 75px;
    height: 75px;
  }

  .nav-nombres {
    gap: 16px;
  }
}

/* Móvil */
@media (max-width: 480px) {
  header {
    padding: 10px 4%;
    height: auto;
    min-height: 70px;
    flex-wrap: wrap;        /* ← si no cabe, baja el nav */
    gap: 8px;
  }

  .img-logo {
    width: 55px;
    height: 55px;
  }

  .nav-nombres {
    gap: 12px;
    font-size: 14px;
  }
}
</style>