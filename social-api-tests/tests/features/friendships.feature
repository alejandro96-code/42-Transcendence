Feature: Friendships

  Scenario Outline: Send a friend request
    Given the user "<sender>" is registered
    And the user "<receiver>" is registered
    And "<sender>" has a session token
    When "<sender>" sends a friend request to "<receiver>"
    Then the friend request from "<sender>" to "<receiver>" should be created successfully

    Examples:
      | sender | receiver |
      | Alice  | Bob      |


  Scenario Outline: Send a duplicate friend request
    Given the user "<sender>" has already sent a friend request to "<receiver>"
    When "<sender>" sends a friend request to "<receiver>" again
    Then the duplicate friend request should be rejected

    Examples:
      | sender | receiver |
      | Alice  | Bob      |


  Scenario Outline: Accept a friend request
    Given the user "<sender>" has sent a friend request to "<receiver>"
    And "<receiver>" has a session token
    When "<receiver>" accepts the friend request from "<sender>"
    Then the friend request from "<sender>" to "<receiver>" should be accepted successfully

    Examples:
      | sender | receiver |
      | Alice  | Bob      |