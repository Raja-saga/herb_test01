function LocationStatus({ location, error }) {
  if (error) {
    return (
      <p style={{ color: "red" }}>
        Location error: {error}
      </p>
    );
  }

  if (!location) {
    return <p>Location not provided yet</p>;
  }

  return (
    <p style={{ color: "green" }}>
      Location set:{" "}
      {location.latitude.toFixed(4)},{" "}
      {location.longitude.toFixed(4)}
    </p>
  );
}

export default LocationStatus;