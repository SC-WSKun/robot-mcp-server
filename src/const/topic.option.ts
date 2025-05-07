export { CMD_VEL_TOPIC_OPTION }

const CMD_VEL_TOPIC_OPTION = {
  encoding: 'cdr',
  schema:
    '# This expresses velocity in free space broken into its linear and angular parts.\n\nVector3  linear\nVector3  angular\n\n================================================================================\nMSG: geometry_msgs/Vector3\n# This represents a vector in free space.\n\n# This is semantically different than a point.\n# A vector is always anchored at the origin.\n# When a transform is applied to a vector, only the rotational component is applied.\n\nfloat64 x\nfloat64 y\nfloat64 z\n',
  schemaEncoding: 'ros2msg',
  schemaName: 'geometry_msgs/msg/Twist',
  topic: '/cmd_vel',
}
