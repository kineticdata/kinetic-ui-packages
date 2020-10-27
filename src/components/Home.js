import React from "react";
import { compose, lifecycle } from "recompose";
import { connect } from "../../redux/store";

const HomeComponent = (props) => (
  <div className="page-container">
    <div className="page-panel">
      <div className="p-5 text-center">
        <h1>Welcome to the Scaffold Package!</h1>
        <p>This is the home page.</p>
      </div>
    </div>
  </div>
);

const mapStateToProps = (state) => ({
  appLocation: state.app.location,
});

const mapDispatchToProps = {};

export const Home = compose(
  connect(mapStateToProps, mapDispatchToProps),
  lifecycle({
    componentDidMount() {},
  })
)(HomeComponent);
